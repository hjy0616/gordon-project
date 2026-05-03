"use client";

import { useState, useRef, useEffect } from "react";

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readonly?: boolean;
}

export function EditableLabel({
  value,
  onChange,
  className = "",
  readonly,
}: EditableLabelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 편집 진입 시 포커스 + 전체 선택
  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  // 입력 길이에 따라 textarea 높이 자동 확장 — 길어져도 앞 내용이 안 잘림
  useEffect(() => {
    if (editing && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [draft, editing]);

  if (readonly || !editing) {
    return (
      <div
        className={`whitespace-pre-wrap break-words ${className}`}
        onDoubleClick={() => {
          if (readonly) return;
          setDraft(value);
          setEditing(true);
        }}
      >
        {value || "(더블클릭하여 편집)"}
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      rows={1}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft.trim() && draft.trim() !== value) {
          onChange(draft.trim());
        }
      }}
      onKeyDown={(e) => {
        // Enter = 저장, Shift+Enter = 줄바꿈 (긴 텍스트를 여러 줄로 나누고 싶을 때)
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      style={{ overflow: "hidden", color: "var(--foreground)", colorScheme: "light dark" }}
      className={`w-full resize-none rounded border border-primary/50 bg-transparent px-1 py-0 outline-none text-inherit ${className}`}
    />
  );
}
