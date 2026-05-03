"use client";

import Link from "next/link";
import { Globe, Star } from "lucide-react";
import { useToggleFavorite } from "@/lib/queries/use-mind-maps";
import type { MindMapSummary } from "@/types/mind-map";

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const week = Math.floor(day / 7);
  if (week < 4) return `${week}주 전`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}개월 전`;
  return `${Math.floor(day / 365)}년 전`;
}

export function MindMapListItem({ item }: { item: MindMapSummary }) {
  const toggle = useToggleFavorite(item.id);

  return (
    <li className="group">
      <div className="relative flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/40">
        <Link
          href={`/mind-map/${item.id}`}
          className="flex flex-1 items-center gap-3 min-w-0"
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-base"
            aria-hidden
          >
            {item.emoji ?? "·"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium">
                {item.title || "Untitled"}
              </span>
              {item.isPublic ? (
                <Globe
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-label="공개"
                />
              ) : null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {item.nodeCount}노드 · {formatRelative(item.updatedAt)}
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle.mutate();
          }}
          aria-label={item.isFavorite ? "별표 해제" : "별표"}
          aria-pressed={item.isFavorite}
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 aria-pressed:opacity-100 aria-pressed:text-amber-500"
        >
          <Star
            className="size-4"
            fill={item.isFavorite ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
      </div>
    </li>
  );
}
