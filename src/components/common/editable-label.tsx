"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";

interface EditableLabelProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readonly?: boolean;
  style?: CSSProperties;
  // undefined면 text-align class 자동 미적용 (호출자 className 보존).
  // 명시되면 className 뒤에 text-{left|center|right} 추가 → CSS source order로 우선.
  align?: "left" | "center" | "right";
}

export function EditableLabel({
  value,
  onChange,
  className = "",
  readonly,
  style,
  align,
}: EditableLabelProps) {
  // align이 undefined면 빈 문자열 — 호출자 className의 text-align을 그대로 보존.
  // Lasagna 노드 3종(event/liquidity/transmission)이 className="text-center"로
  // 호출 중이므로 자동 적용을 안 해야 회귀가 없다.
  const alignClass =
    align === "center" ? "text-center"
    : align === "right" ? "text-right"
    : align === "left" ? "text-left"
    : "";
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
        className={`whitespace-pre-wrap break-words ${className} ${alignClass}`}
        style={style}
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
      style={{
        overflow: "hidden",
        color: "var(--foreground)",
        colorScheme: "light dark",
        ...style,
      }}
      className={`w-full resize-none rounded border border-primary/50 bg-transparent px-1 py-0 outline-none text-inherit ${className} ${alignClass}`}
    />
  );
}
