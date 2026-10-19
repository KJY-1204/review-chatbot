import { MessageSquare } from "lucide-react";
import { EXAMPLE_QUESTIONS } from "@/lib/mock-data";

export function EmptyState({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <MessageSquare className="h-10 w-10 text-zinc-300" aria-hidden />
      <div>
        <p className="font-semibold text-zinc-800">리뷰에 대해 무엇이든 물어보세요</p>
        <p className="mt-1 text-sm text-zinc-500">아래 예시 질문으로 시작해 볼 수 있어요.</p>
      </div>
      <div className="flex flex-col gap-2">
        {EXAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
