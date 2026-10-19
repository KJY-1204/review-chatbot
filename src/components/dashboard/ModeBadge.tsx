import { Database, FlaskConical, HelpCircle } from "lucide-react";
import type { DataMode } from "@/lib/types";

const STYLES = {
  mock: { label: "Mock 모드", className: "bg-amber-100 text-amber-800", Icon: FlaskConical },
  real: { label: "실데이터 모드", className: "bg-emerald-100 text-emerald-800", Icon: Database },
  unknown: { label: "모드 확인 불가", className: "bg-zinc-200 text-zinc-600", Icon: HelpCircle },
} as const;

export function ModeBadge({ mode }: { mode?: DataMode }) {
  const { label, className, Icon } = STYLES[mode ?? "unknown"];
  return (
    <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
