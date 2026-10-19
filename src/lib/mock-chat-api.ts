import type { ChatApi } from "./chat-api";
import { MOCK_INDEXED_COUNT, MOCK_REVIEWS } from "./mock-data";

const DELAY_MS = 800;
const ERROR_TRIGGER = "오류 테스트";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockChatApi: ChatApi = {
  async sendQuestion(question) {
    await wait(DELAY_MS);
    if (question.includes(ERROR_TRIGGER)) {
      return { success: false, error: "답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요." };
    }
    return {
      success: true,
      answer: `"${question}"에 대한 분석 결과입니다. 리뷰 전반에서 노이즈 캔슬링과 착용감, 가성비에 대한 긍정적인 평가가 많았고, 통화 품질과 연결 안정성에는 일부 아쉬움이 언급되었습니다.`,
      sources: MOCK_REVIEWS,
    };
  },

  async indexSamples() {
    await wait(DELAY_MS * 2);
    return { success: true, data: { indexed: MOCK_INDEXED_COUNT } };
  },
};
