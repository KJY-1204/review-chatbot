"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SourceReview } from "@/lib/types";
import { ReviewCard } from "./ReviewCard";

const MAX_SOURCES = 5;

export function SourceReviews({ sources }: { sources?: SourceReview[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!sources || sources.length === 0) return null;
  const shown = sources.slice(0, MAX_SOURCES);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        참고 리뷰 {shown.length}건
      </button>
      {open && (
        <ul id={panelId} className="mt-2 space-y-2">
          {shown.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      )}
    </div>
  );
}
