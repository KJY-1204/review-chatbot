import { Star } from "lucide-react";

export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`5점 만점에 ${rating}점`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-3.5 w-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300"}`}
            aria-hidden
          />
        ))}
      </span>
      <span className="text-xs font-medium text-zinc-600">{rating}</span>
    </span>
  );
}
