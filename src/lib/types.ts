export type DataMode = "mock" | "real";

export interface SourceReview {
  id: string;
  rating: number;
  title: string;
  content: string;
  author: string;
  date?: string;
  score?: number;
  verifiedPurchase?: boolean;
}

export interface ChatResponse {
  success: boolean;
  mode?: DataMode;
  answer?: string;
  sources?: SourceReview[];
  error?: string;
}

export interface IndexResponse {
  success: boolean;
  mode?: DataMode;
  data?: { indexed: number };
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReview[];
  isError?: boolean;
}
