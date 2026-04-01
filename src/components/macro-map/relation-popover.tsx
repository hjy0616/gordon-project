"use client";

import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryNameKo, getFlagEmoji } from "@/data/country-names";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { RelationType } from "@/types/macro-map";

export function RelationPopover() {
  const popover = useMacroMapStore((s) => s.relationPopover);
  const editBase = useMacroMapStore((s) => s.relationEditBase);
  const relations = useMacroMapStore((s) => s.relations);
  const addRelation = useMacroMapStore((s) => s.addRelation);
  const removeRelation = useMacroMapStore((s) => s.removeRelation);

  if (!popover || !editBase) return null;

  const existing = relations.find(
    (r) => r.from_iso === editBase && r.to_iso === popover.targetIso,
  );

  const nameKo = getCountryNameKo(popover.targetIso);
  const flag = getFlagEmoji(popover.targetIso);

  const handleAdd = (type: RelationType) => {
    addRelation(editBase, popover.targetIso, type);
  };

  const handleRemove = () => {
    if (existing) removeRelation(existing.id);
  };

  return (
    <div
      className="absolute z-20 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm"
      style={{
        left: popover.x,
        top: popover.y,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      <div className="mb-2 text-center text-sm font-medium">
        {flag} {nameKo}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleAdd("ally")}
          className={
            existing?.type === "ally"
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "border border-blue-600 bg-transparent text-blue-400 hover:bg-blue-600/20"
          }
        >
          동맹
        </Button>
        <Button
          size="sm"
          onClick={() => handleAdd("rival")}
          className={
            existing?.type === "rival"
              ? "bg-[#800020] text-white hover:bg-[#990028]"
              : "border border-[#800020] bg-transparent text-[#cc4060] hover:bg-[#800020]/20"
          }
        >
          적국
        </Button>
        {existing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
