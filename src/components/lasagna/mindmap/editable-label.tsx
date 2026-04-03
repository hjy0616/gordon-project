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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (readonly || !editing) {
    return (
      <p
        className={className}
        onDoubleClick={() => {
          if (readonly) return;
          setDraft(value);
          setEditing(true);
        }}
      >
        {value || "(더블클릭하여 편집)"}
      </p>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (draft.trim() && draft.trim() !== value) {
          onChange(draft.trim());
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className="w-full rounded border border-primary/50 bg-transparent px-1 py-0 text-center text-sm font-bold outline-none"
    />
  );
}
