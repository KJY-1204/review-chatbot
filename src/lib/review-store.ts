import { readFile } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

export interface RetrievedReview {
  id: string;
  title: string;
  content: string;
  rating: number;
  author: string;
  date: string;
  score: number;
}

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface MockReview {
  id: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date: string;
  helpfulVotes: number;
  verifiedPurchase: boolean;
}

interface MockStore {
  reviews: MockReview[] | null;
  loading: Promise<number> | null;
  messages: Map<string, StoredMessage[]>;
}

const CSV_PATH = path.join(process.cwd(), "samples", "review.csv");
const DEFAULT_CHAT_ID = "default";
const SCORE_MIN = 0.65;
const SCORE_MAX = 0.98;
const TITLE_WEIGHT = 2;
const VOTES_WEIGHT = 0.1;

// dev 서버에서 라우트별로 모듈이 따로 평가되어도 같은 저장소를 공유한다.
const globalForStore = globalThis as typeof globalThis & { __mockReviewStore?: MockStore };
const store: MockStore = (globalForStore.__mockReviewStore ??= {
  reviews: null,
  loading: null,
  messages: new Map(),
});

function parseReviews(csv: string): MockReview[] {
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  const reviews: MockReview[] = [];
  for (const row of data) {
    const rating = Number(row.rating);
    const helpfulVotes = Number(row.helpful_votes);
    if (!row.id || !row.content || !Number.isFinite(rating) || !Number.isFinite(helpfulVotes)) continue;
    reviews.push({
      id: row.id,
      rating,
      title: row.title ?? "",
      content: row.content,
      author: row.author ?? "",
      date: row.date ?? "",
      helpfulVotes,
      verifiedPurchase: row.verified_purchase?.trim().toLowerCase() === "true",
    });
  }
  return reviews;
}

export function indexMockReviews(): Promise<number> {
  if (store.loading) return store.loading;
  const loading = readFile(CSV_PATH, "utf-8")
    .then((csv) => {
      const reviews = parseReviews(csv);
      store.reviews = reviews;
      return reviews.length;
    })
    .finally(() => {
      store.loading = null;
    });
  store.loading = loading;
  return loading;
}

// 긴 조사부터 검사해야 "에서"가 "서"보다 먼저 제거된다.
const PARTICLES = [
  "인가요", "했나요", "한가요", "있나요", "어때요", "에서", "으로", "이나", "나요",
  "은", "는", "이", "가", "을", "를", "도", "의", "에", "로", "와", "과",
];

function extractKeywords(query: string): string[] {
  const keywords = new Set<string>();
  for (const raw of query.toLowerCase().split(/[\s.,!?~"'()[\]{}:;/\\]+/)) {
    let token = raw;
    for (const particle of PARTICLES) {
      if (token.endsWith(particle) && token.length - particle.length >= 2) {
        token = token.slice(0, -particle.length);
        break;
      }
    }
    if (token.length >= 2) keywords.add(token);
  }
  return [...keywords];
}

function countOccurrences(text: string, keyword: string): number {
  let count = 0;
  for (let i = text.indexOf(keyword); i !== -1; i = text.indexOf(keyword, i + keyword.length)) count++;
  return count;
}

function normalize(raws: number[]): number[] {
  const min = Math.min(...raws);
  const max = Math.max(...raws);
  if (max === min) return raws.map(() => SCORE_MAX);
  return raws.map((raw) => {
    const score = SCORE_MIN + ((raw - min) / (max - min)) * (SCORE_MAX - SCORE_MIN);
    return Math.round(score * 100) / 100;
  });
}

function toRetrieved(items: { review: MockReview; raw: number }[]): RetrievedReview[] {
  const scores = normalize(items.map((item) => item.raw));
  return items.map(({ review }, i) => ({
    id: review.id,
    title: review.title,
    content: review.content,
    rating: review.rating,
    author: review.author,
    date: review.date,
    score: scores[i],
  }));
}

const byRankThenVotesThenId = (
  a: { review: MockReview; raw: number },
  b: { review: MockReview; raw: number },
) => b.raw - a.raw || b.review.helpfulVotes - a.review.helpfulVotes || a.review.id.localeCompare(b.review.id);

export async function searchMockReviews(query: string, topK = 5): Promise<RetrievedReview[]> {
  if (!store.reviews) await indexMockReviews();
  const reviews = store.reviews ?? [];
  const keywords = extractKeywords(query);

  const matched: { review: MockReview; raw: number }[] = [];
  for (const review of reviews) {
    const title = review.title.toLowerCase();
    const content = review.content.toLowerCase();
    let matchScore = 0;
    for (const keyword of keywords) {
      matchScore += countOccurrences(title, keyword) * TITLE_WEIGHT + countOccurrences(content, keyword);
    }
    if (matchScore > 0) matched.push({ review, raw: matchScore + review.helpfulVotes * VOTES_WEIGHT });
  }

  if (matched.length > 0) {
    return toRetrieved(matched.sort(byRankThenVotesThenId).slice(0, topK));
  }

  const fallback = reviews.map((review) => ({ review, raw: review.helpfulVotes }));
  return toRetrieved(fallback.sort(byRankThenVotesThenId).slice(0, topK));
}

export function saveMockMessage(chatId: string | undefined, message: Omit<StoredMessage, "createdAt">): void {
  const key = chatId || DEFAULT_CHAT_ID;
  const list = store.messages.get(key) ?? [];
  list.push({ ...message, createdAt: new Date().toISOString() });
  store.messages.set(key, list);
}

export function getMockMessages(chatId?: string): StoredMessage[] {
  return [...(store.messages.get(chatId || DEFAULT_CHAT_ID) ?? [])];
}
