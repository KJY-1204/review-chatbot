"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatApi } from "@/lib/chat-api";
import type { ChatMessage } from "@/lib/types";

const DEFAULT_ERROR = "답변을 가져오지 못했습니다. 다시 시도해 주세요.";

export function useChat(api: ChatApi) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const seq = useRef(0);

  const send = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || loadingRef.current) return;
      loadingRef.current = true;
      setIsLoading(true);
      const nextId = () => `m${++seq.current}`;
      setMessages((prev) => [...prev, { id: nextId(), role: "user", content: text }]);
      try {
        const res = await api.sendQuestion(text);
        const message: ChatMessage =
          res.success && res.answer !== undefined
            ? { id: nextId(), role: "assistant", content: res.answer, sources: res.sources }
            : { id: nextId(), role: "assistant", content: res.error ?? DEFAULT_ERROR, isError: true };
        setMessages((prev) => [...prev, message]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: DEFAULT_ERROR, isError: true },
        ]);
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [api],
  );

  return { messages, isLoading, send };
}
