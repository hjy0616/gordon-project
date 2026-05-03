"use client";

import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CANVAS_BACKGROUND_COLORS,
  CANVAS_BACKGROUND_PATTERNS,
  type CanvasBackgroundColor,
  type CanvasBackgroundPattern,
} from "@/types/mind-map";
import {
  COLOR_LABELS,
  PATTERN_LABELS,
  bgClassFor,
  colorPreset,
  patternStrokeColor,
} from "@/lib/mind-map/canvas-style";

interface BackgroundPickerProps {
  pattern: CanvasBackgroundPattern;
  color: CanvasBackgroundColor;
  onPatternChange: (next: CanvasBackgroundPattern) => void;
  onColorChange: (next: CanvasBackgroundColor) => void;
  disabled?: boolean;
}

export function BackgroundPicker({
  pattern,
  color,
  onPatternChange,
  onColorChange,
  disabled,
}: BackgroundPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label="캔버스 배경"
            className="size-9 px-0"
          >
            <Palette className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <div className="flex flex-col gap-3 p-2">
          <section>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              패턴
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {CANVAS_BACKGROUND_PATTERNS.map((p) => (
                <PatternSwatch
                  key={p}
                  pattern={p}
                  color={color}
                  selected={p === pattern}
                  onClick={() => onPatternChange(p)}
                />
              ))}
            </div>
          </section>
          <section>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              색상
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {CANVAS_BACKGROUND_COLORS.map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={c === color}
                  onClick={() => onColorChange(c)}
                />
              ))}
            </div>
          </section>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PatternSwatch({
  pattern,
  color,
  selected,
  onClick,
}: {
  pattern: CanvasBackgroundPattern;
  color: CanvasBackgroundColor;
  selected: boolean;
  onClick: () => void;
}) {
  const stroke = patternStrokeColor(color);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={PATTERN_LABELS[pattern]}
      aria-pressed={selected}
      title={PATTERN_LABELS[pattern]}
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-md border transition-colors hover:border-primary ${
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      } ${bgClassFor(color)}`}
    >
      <PatternThumbnail pattern={pattern} stroke={stroke} />
      {selected ? (
        <span className="absolute right-0.5 top-0.5 rounded-full bg-primary p-0.5 text-primary-foreground">
          <Check className="size-2.5" />
        </span>
      ) : null}
    </button>
  );
}

function PatternThumbnail({
  pattern,
  stroke,
}: {
  pattern: CanvasBackgroundPattern;
  stroke: string;
}) {
  // 36×36 영역의 미니 SVG로 패턴 시각화
  const size = 36;
  switch (pattern) {
    case "blank":
      return (
        <span className="text-[10px] text-muted-foreground">—</span>
      );
    case "dots":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
          {[6, 18, 30].map((y) =>
            [6, 18, 30].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} fill={stroke} />
            )),
          )}
        </svg>
      );
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
          {[12, 24].map((p) => (
            <g key={p}>
              <line x1={p} y1={0} x2={p} y2={36} stroke={stroke} strokeWidth={0.6} />
              <line x1={0} y1={p} x2={36} y2={p} stroke={stroke} strokeWidth={0.6} />
            </g>
          ))}
        </svg>
      );
    case "lined":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
          {[10, 20, 30].map((y) => (
            <line
              key={y}
              x1={3}
              y1={y}
              x2={33}
              y2={y}
              stroke={stroke}
              strokeWidth={0.8}
            />
          ))}
        </svg>
      );
    case "cross":
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden>
          {[12, 24].map((y) =>
            [12, 24].map((x) => (
              <g key={`${x}-${y}`} stroke={stroke} strokeWidth={1}>
                <line x1={x - 2} y1={y} x2={x + 2} y2={y} />
                <line x1={x} y1={y - 2} x2={x} y2={y + 2} />
              </g>
            )),
          )}
        </svg>
      );
  }
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: CanvasBackgroundColor;
  selected: boolean;
  onClick: () => void;
}) {
  const preset = colorPreset(color);
  const isNeutral = color === "white" || color === "black";
  const idleBorder = isNeutral ? "border-foreground/30" : "border-border";
  const checkShadow =
    color === "white"
      ? "drop-shadow-[0_0_2px_black]"
      : color === "black"
        ? "drop-shadow-[0_0_2px_white]"
        : "drop-shadow-[0_0_2px_white] dark:drop-shadow-[0_0_2px_black]";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={COLOR_LABELS[color]}
      aria-pressed={selected}
      title={COLOR_LABELS[color]}
      className={`relative flex aspect-square items-center justify-center rounded-full border transition-transform hover:scale-110 ${
        selected ? "border-primary ring-2 ring-primary" : idleBorder
      } ${bgClassFor(color)}`}
    >
      {/* default(테마) 색을 시각적으로 보이게 — 가운데에 옅은 텍스트로 표시 */}
      {color === "default" ? (
        <span
          className="absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground"
          style={{ display: selected ? "none" : "flex" }}
          aria-hidden
        >
          기본
        </span>
      ) : null}
      <span className="sr-only">
        {COLOR_LABELS[color]} ({preset.swatchLight})
      </span>
      {selected ? (
        <Check className={`size-3 text-primary ${checkShadow}`} />
      ) : null}
    </button>
  );
}
