import { BadgeCheck } from "lucide-react";
import type { SourceReview } from "@/lib/types";
import { StarRating } from "./StarRating";

export function ReviewCard({ review }: { review: SourceReview }) {
  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating rating={review.rating} />
        {review.score !== undefined && (
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            관련도 {Math.round(review.score * 100)}%
          </span>
        )}
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <BadgeCheck className="h-3 w-3" aria-hidden />
            검증 구매
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-zinc-900">{review.title}</p>
      <p className="mt-0.5 line-clamp-3 text-sm text-zinc-600">{review.content}</p>
      <p className="mt-1.5 text-xs text-zinc-400">{review.author}</p>
    </li>
  );
}
