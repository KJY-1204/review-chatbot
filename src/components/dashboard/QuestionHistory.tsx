import { History } from "lucide-react";

interface Props {
  questions: string[];
  onSelect: (question: string) => void;
}

export function QuestionHistory({ questions, onSelect }: Props) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
        <History className="h-3.5 w-3.5" aria-hidden />
        최근 분석 질문
      </h2>
      {questions.length === 0 ? (
        <p className="text-sm text-zinc-400">아직 질문이 없습니다</p>
      ) : (
        <ul className="space-y-1">
          {questions.map((q, i) => (
            <li key={`${i}-${q}`}>
              <button
                type="button"
                onClick={() => onSelect(q)}
                title={q}
                className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
