import { Headphones } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/mock-data";

export function ProductBanner() {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Headphones className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">분석 대상 상품</p>
        <p className="truncate text-sm font-semibold text-zinc-900">{PRODUCT_NAME}</p>
      </div>
    </div>
  );
}
