import { AlertCircle, Bot, Loader2, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { SourceReviews } from "@/components/reviews/SourceReviews";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : message.isError ? AlertCircle : Bot;

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-indigo-600 text-white" : message.isError ? "bg-red-100 text-red-600" : "bg-zinc-200 text-zinc-700"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-indigo-600 text-white"
            : message.isError
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-zinc-200 bg-white text-zinc-800"
        }`}
        role={message.isError ? "alert" : undefined}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && !message.isError && <SourceReviews sources={message.sources} />}
      </div>
    </div>
  );
}

export function LoadingBubble() {
  return (
    <div className="flex gap-2" role="status" aria-live="polite">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700">
        <Bot className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        분석 중...
      </div>
    </div>
  );
}
