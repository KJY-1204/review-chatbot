"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { LoadingBubble, MessageBubble } from "./MessageBubble";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onSelectExample: (question: string) => void;
}

export function MessageList({ messages, isLoading, onSelectExample }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EmptyState onSelect={onSelectExample} />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {isLoading && <LoadingBubble />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
