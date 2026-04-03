"use client";

import { MapPin } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";

export function MobileLocateBar() {
  const createDraft = useTreasureMapStore((s) => s.createDraft);
  const setCreateStep = useTreasureMapStore((s) => s.setCreateStep);
  const setPanelMode = useTreasureMapStore((s) => s.setPanelMode);
  const clearCreateDraft = useTreasureMapStore((s) => s.clearCreateDraft);

  const handleCancel = () => {
    clearCreateDraft();
    setPanelMode("list");
  };

  const handleConfirm = () => {
    setCreateStep("form");
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 rounded-lg border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        {createDraft
          ? createDraft.region || `${createDraft.lat.toFixed(4)}, ${createDraft.lng.toFixed(4)}`
          : "검색바에서 위치를 선택하세요"}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          className="flex-1 rounded-md border border-border px-3 py-2.5 text-sm font-medium transition-colors active:bg-muted"
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={!createDraft}
          className="flex-1 rounded-md bg-[#A71C2E] px-3 py-2.5 text-sm font-medium text-white transition-colors active:bg-[#8a1726] disabled:cursor-not-allowed disabled:opacity-40"
        >
          위치 확정
        </button>
      </div>
    </div>
  );
}
