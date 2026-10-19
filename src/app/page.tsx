import { Dashboard } from "@/components/dashboard/Dashboard";
import type { DataMode } from "@/lib/types";

export default function Home() {
  const mode: DataMode = process.env.USE_MOCK !== "false" ? "mock" : "real";
  return <Dashboard mode={mode} />;
}
