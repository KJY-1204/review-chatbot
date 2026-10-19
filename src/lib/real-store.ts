import { readFile } from "node:fs/promises";
import { Pinecone } from "@pinecone-database/pinecone";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CSV_PATH, parseReviews, type RetrievedReview, type StoredMessage } from "@/lib/review-store";

const NAMESPACE = "reviews";
const BATCH_SIZE = 96;
const DEFAULT_CHAT_ID = "default";

// 외부 호출 전에 설정 누락을 알리되, 메시지에는 변수 이름만 담고 값은 노출하지 않는다.
export class RealConfigError extends Error {}

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new RealConfigError(`${name} 환경변수가 설정되어 있지 않습니다.`);
  return value;
}

function getSupabase(): SupabaseClient {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return createClient(url, key, { auth: { persistSession: false } });
}

function getNamespace() {
  const apiKey = requireEnv("PINECONE_API_KEY", process.env.PINECONE_API_KEY);
  const indexName = requireEnv("PINECONE_INDEX_NAME", process.env.PINECONE_INDEX_NAME);
  const host = requireEnv("PINECONE_HOST", process.env.PINECONE_HOST);
  return new Pinecone({ apiKey }).index(indexName, host).namespace(NAMESPACE);
}

export async function indexRealReviews(): Promise<number> {
  // 어느 쪽이든 외부 호출을 시작하기 전에 설정을 모두 검증한다.
  const supabase = getSupabase();
  const ns = getNamespace();

  const reviews = parseReviews(await readFile(CSV_PATH, "utf-8"));

  // Supabase 가 원본이므로 먼저 적재하고, 실패하면 Pinecone 은 건드리지 않는다.
  const { error } = await supabase.from("reviews").upsert(
    reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      content: r.content,
      author: r.author,
      date: r.date || null,
      helpful_votes: r.helpfulVotes,
      verified_purchase: r.verifiedPurchase,
    })),
    { onConflict: "id" },
  );
  if (error) throw new Error(`Supabase reviews upsert 실패: ${error.message}`);

  const records = reviews.map((r) => ({
    _id: r.id,
    text: `${r.title} ${r.content}`,
    rating: Number(r.rating),
    author: r.author,
    title: r.title,
    content: r.content,
  }));

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await ns.upsertRecords({ records: records.slice(i, i + BATCH_SIZE) });
  }
  return records.length;
}

export async function searchRealReviews(query: string, topK = 5): Promise<RetrievedReview[]> {
  const supabase = getSupabase();
  const ns = getNamespace();

  const res = await ns.searchRecords({
    query: { topK, inputs: { text: query } },
    fields: ["title", "content", "rating", "author"],
  });

  const hits = res.result.hits;
  if (hits.length === 0) return [];

  // Pinecone 레코드에는 date 가 없으므로 Supabase 에서 보강한다. 실패해도 검색 결과는 돌려준다.
  const dates = new Map<string, string>();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, date")
    .in("id", hits.map((h) => h._id));
  if (error) {
    console.error("[real-store] date 보강 실패:", error.message);
  } else {
    for (const row of data ?? []) if (row.date) dates.set(row.id, row.date);
  }

  return hits
    .map((hit) => {
      const f = hit.fields as Record<string, unknown>;
      return {
        id: hit._id,
        title: String(f.title ?? ""),
        content: String(f.content ?? ""),
        rating: Number(f.rating),
        author: String(f.author ?? ""),
        date: dates.get(hit._id) ?? "",
        score: hit._score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export async function saveRealMessages(
  chatId: string | undefined,
  messages: Omit<StoredMessage, "createdAt">[],
): Promise<void> {
  const chat_id = chatId || DEFAULT_CHAT_ID;
  const base = Date.now();
  // 한 번의 insert 로 보내되 created_at 을 1ms 씩 벌려 순서를 보장한다.
  const { error } = await getSupabase()
    .from("messages")
    .insert(
      messages.map((m, i) => ({
        chat_id,
        role: m.role,
        content: m.content,
        created_at: new Date(base + i).toISOString(),
      })),
    );
  if (error) throw new Error(`Supabase messages insert 실패: ${error.message}`);
}
