import type { ChatApi } from "./chat-api";

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // 서버가 오류 상태여도 규격 JSON({ success: false, error })이면 그대로 전달한다.
  return (await res.json()) as T;
}

// 세션당 하나의 대화 ID 로 서버 대화 기록을 묶는다. 렌더 중 생성하지 않도록 첫 요청 때 만든다.
export function createHttpChatApi(): ChatApi {
  let chatId: string | undefined;
  return {
    sendQuestion: (question) => {
      chatId ??= crypto.randomUUID();
      return postJson("/api/chat", { query: question, chatId });
    },
    indexSamples: () => postJson("/api/index-data"),
  };
}
