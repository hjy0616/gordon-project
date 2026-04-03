"use client";

import { List, Plus } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";

export function MobileFab() {
  const setPanelMode = useTreasureMapStore((s) => s.setPanelMode);

  return (
    <div className="absolute bottom-20 right-4 z-30 flex flex-col gap-2">
      <button
        onClick={() => setPanelMode("create")}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/90 shadow-lg backdrop-blur-sm transition-colors active:bg-muted"
        aria-label="지역 추가"
      >
        <Plus className="h-5 w-5" />
      </button>
      <button
        onClick={() => setPanelMode("list")}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background/90 shadow-lg backdrop-blur-sm transition-colors active:bg-muted"
        aria-label="지역 목록"
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}
