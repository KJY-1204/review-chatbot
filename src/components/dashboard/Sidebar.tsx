"use client";

import { Sparkles } from "lucide-react";
import type { IndexStatus } from "@/hooks/useIndexing";
import type { DataMode } from "@/lib/types";
import { IndexButton } from "./IndexButton";
import { ModeBadge } from "./ModeBadge";
import { QuestionHistory } from "./QuestionHistory";

interface Props {
  mode?: DataMode;
  indexing: { status: IndexStatus; indexed: number | null; error: string | null; start: () => void };
  questions: string[];
  onSelectQuestion: (question: string) => void;
}

export function Sidebar({ mode, indexing, questions, onSelectQuestion }: Props) {
  return (
    <div className="flex h-full flex-col gap-5 bg-zinc-50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <h1 className="text-base font-bold text-zinc-900">쇼핑 리뷰 AI 분석기</h1>
      </div>
      <ModeBadge mode={mode} />
      <IndexButton
        status={indexing.status}
        indexed={indexing.indexed}
        error={indexing.error}
        onClick={indexing.start}
      />
      <QuestionHistory questions={questions} onSelect={onSelectQuestion} />
    </div>
  );
}
