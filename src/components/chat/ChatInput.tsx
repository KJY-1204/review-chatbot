"use client";

import type { KeyboardEvent, Ref } from "react";
import { Send } from "lucide-react";

interface Props {
  onSend: (question: string) => void;
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  inputRef: Ref<HTMLTextAreaElement>;
}

export function ChatInput({ onSend, disabled, value, onChange, inputRef }: Props) {
  const canSend = !disabled && value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    onChange("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 IME 조합 중(및 Safari 의 조합 종료 직후 keydown) Enter 는 전송하지 않는다.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="리뷰에 대해 질문해 보세요 (Shift+Enter: 줄바꿈)"
          aria-label="질문 입력"
          className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="전송"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
