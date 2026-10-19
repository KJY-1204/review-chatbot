"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatApi } from "@/lib/chat-api";

export type IndexStatus = "idle" | "loading" | "done" | "error";

const DEFAULT_ERROR = "인덱싱에 실패했습니다.";

export function useIndexing(api: ChatApi) {
  const [status, setStatus] = useState<IndexStatus>("idle");
  const [indexed, setIndexed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus("loading");
    setError(null);
    try {
      const res = await api.indexSamples();
      if (res.success && res.data) {
        setIndexed(res.data.indexed);
        setStatus("done");
      } else {
        setError(res.error ?? DEFAULT_ERROR);
        setStatus("error");
      }
    } catch {
      setError(DEFAULT_ERROR);
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [api]);

  return { status, indexed, error, start };
}
