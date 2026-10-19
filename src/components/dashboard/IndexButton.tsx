"use client";

import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react";
import type { IndexStatus } from "@/hooks/useIndexing";

interface Props {
  status: IndexStatus;
  indexed: number | null;
  error: string | null;
  onClick: () => void;
}

export function IndexButton({ status, indexed, error, onClick }: Props) {
  const loading = status === "loading";
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Database className="h-4 w-4" aria-hidden />
        )}
        {loading ? "인덱싱 중..." : status === "error" ? "다시 시도" : "샘플 데이터 인덱싱"}
      </button>
      <div aria-live="polite">
        {status === "done" && (
          <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            리뷰 {indexed}건 인덱싱 완료
          </p>
        )}
        {status === "error" && (
          <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
