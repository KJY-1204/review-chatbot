"use client";

import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageList } from "@/components/chat/MessageList";
import { ProductBanner } from "@/components/chat/ProductBanner";
import { useChat } from "@/hooks/useChat";
import { useIndexing } from "@/hooks/useIndexing";
import { mockChatApi } from "@/lib/mock-chat-api";
import type { DataMode } from "@/lib/types";
import { Sidebar } from "./Sidebar";

const api = mockChatApi;

export function Dashboard({ mode }: { mode: DataMode }) {
  const { messages, isLoading, send } = useChat(api);
  const indexing = useIndexing(api);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 최신순 히스토리는 user 메시지에서 파생한다.
  const questions = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .reverse();

  const fillInput = (question: string) => {
    setInput(question);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const sidebar = (
    <Sidebar mode={mode} indexing={indexing} questions={questions} onSelectQuestion={fillInput} />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-100">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-200 lg:block">{sidebar}</aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="사이드바 닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85%] shadow-xl">
            <button
              type="button"
              aria-label="사이드바 닫기 버튼"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-md p-1 text-zinc-500 hover:bg-zinc-200"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b border-zinc-200 bg-white lg:hidden">
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setSidebarOpen(true)}
            className="m-2 rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <span className="text-sm font-bold text-zinc-900">쇼핑 리뷰 AI 분석기</span>
        </div>
        <ProductBanner />
        <MessageList messages={messages} isLoading={isLoading} onSelectExample={send} />
        <ChatInput
          onSend={send}
          disabled={isLoading}
          value={input}
          onChange={setInput}
          inputRef={inputRef}
        />
      </main>
    </div>
  );
}
