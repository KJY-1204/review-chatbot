import type { ChatResponse, IndexResponse } from "./types";

export interface ChatApi {
  sendQuestion(question: string): Promise<ChatResponse>;
  indexSamples(): Promise<IndexResponse>;
}
