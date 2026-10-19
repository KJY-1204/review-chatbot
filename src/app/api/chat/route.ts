import { NextResponse } from "next/server";
import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { saveMockMessage, searchMockReviews, type RetrievedReview } from "@/lib/review-store";

const TOP_K = 5;

const SYSTEM_PROMPT = `당신은 전자제품 쇼핑몰의 전문 리뷰 분석가입니다.
아래 제공된 [실제 구매 고객 리뷰 데이터]만을 바탕으로 사용자의 질문에 친절하고 솔직하게 답변하세요.
리뷰에 없는 사실을 추측하여 지어내지 마세요.
장점과 단점이 모두 존재한다면 균형 있게 설명하고, 관련 리뷰 작성자의 의견을 인용하세요.

[실제 구매 고객 리뷰 데이터]
{context}`;

const fail = (error: string, status: number) =>
  NextResponse.json({ success: false, error }, { status });

function buildContext(reviews: RetrievedReview[]): string {
  return reviews
    .map((r, i) => `[리뷰 ${i + 1}] ★${r.rating} ${r.title} — ${r.content} (작성자: ${r.author})`)
    .join("\n");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("요청 본문이 올바른 JSON 형식이 아닙니다.", 400);
  }

  const { query, chatId } = (body ?? {}) as { query?: unknown; chatId?: unknown };
  if (typeof query !== "string" || !query.trim()) {
    return fail("질문을 입력해 주세요.", 400);
  }
  const question = query.trim();
  const chatKey = typeof chatId === "string" && chatId ? chatId : undefined;

  if (process.env.USE_MOCK === "false") {
    return fail("실데이터 모드의 질문 답변은 아직 지원하지 않습니다.", 501);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const sources = await searchMockReviews(question, TOP_K);

    // 키가 없거나 SKIP_GENERATION=true 이면 LLM 호출을 생략하고 검색 결과 JSON 을 답변 자리에 그대로 돌려준다.
    let answer: string;
    if (!apiKey || process.env.SKIP_GENERATION === "true") {
      answer = JSON.stringify({ query: question, sources }, null, 2);
    } else {
      const chain = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
        ["human", "{question}"],
      ])
        .pipe(new ChatAnthropic({ model: "claude-haiku-4-5", apiKey }))
        .pipe(new StringOutputParser());

      answer = await chain.invoke({ context: buildContext(sources), question });
    }

    saveMockMessage(chatKey, { role: "user", content: question });
    saveMockMessage(chatKey, { role: "assistant", content: answer });

    return NextResponse.json({ success: true, mode: "mock", answer, sources });
  } catch (err) {
    console.error("[chat] 답변 생성 실패:", err);
    return fail("답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.", 500);
  }
}
