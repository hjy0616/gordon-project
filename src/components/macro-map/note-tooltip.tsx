"use client";

import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryNameKo, getFlagEmoji } from "@/data/country-names";
import { splitByUrls } from "@/lib/linkify";

const MAX_PREVIEW = 150;

// 모듈 레벨 플래그: 툴팁 위에 마우스가 있는지 추적
let _isTooltipHovered = false;
export function isTooltipHovered() {
  return _isTooltipHovered;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

export function NoteTooltip() {
  const hoveredCountry = useMacroMapStore((s) => s.hoveredCountry);
  const hoverPos = useMacroMapStore((s) => s.hoverPos);
  const notes = useMacroMapStore((s) => s.notes);
  const editMode = useMacroMapStore((s) => s.editMode);
  const editPopover = useMacroMapStore((s) => s.editPopover);

  if (!hoveredCountry || !hoverPos) return null;
  if (editMode) return null;
  if (editPopover) return null;

  const noteText = notes[hoveredCountry];
  if (!noteText?.trim()) return null;

  const preview = truncate(noteText.trim(), MAX_PREVIEW);
  const parts = splitByUrls(preview);

  // 국가 중심 위에 수평 중앙 정렬, 상단 근접 시 아래로 flip
  const flipY = hoverPos.y < 120;

  const style: React.CSSProperties = {
    left: hoverPos.x,
    top: flipY ? hoverPos.y + 16 : hoverPos.y - 16,
    transform: flipY ? "translateX(-50%)" : "translate(-50%, -100%)",
    maxWidth: 280,
  };

  return (
    <div
      className="pointer-events-auto absolute z-30 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm"
      style={style}
      onMouseEnter={() => { _isTooltipHovered = true; }}
      onMouseLeave={() => {
        _isTooltipHovered = false;
        useMacroMapStore.setState({ hoveredCountry: null, hoverPos: null });
      }}
    >
      <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        <span>{getFlagEmoji(hoveredCountry)}</span>
        <span>{getCountryNameKo(hoveredCountry)}</span>
      </div>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
        {parts.map((part, i) =>
          part.type === "url" ? (
            <a
              key={i}
              href={part.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 underline hover:text-orange-300"
              onClick={(e) => e.stopPropagation()}
            >
              {part.value}
            </a>
          ) : (
            <span key={i}>{part.value}</span>
          ),
        )}
      </p>
    </div>
  );
}
