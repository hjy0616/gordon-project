"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import type { CountryIndicators, CountryGroupType } from "@/types/macro-map";
import { getCountryInfo } from "@/data/country-names";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";

interface DraggableCountryCardProps {
  country: CountryIndicators;
  groupType: CountryGroupType;
}

export function DraggableCountryCard({ country, groupType }: DraggableCountryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: country.iso_a3 });

  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const setCountryGroup = useMacroMapStore((s) => s.setCountryGroup);
  const info = getCountryInfo(country.iso_a3);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-md border border-border bg-card px-3 py-2 transition-colors hover:bg-accent/50 active:cursor-grabbing"
    >
      <span className="text-base">{info.flag_emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {info.name_ko}
        </div>
        <div className="text-[10px] text-muted-foreground">
          ${country.gdp_nominal}B GDP
        </div>
      </div>
      {groupType !== "unclassified" ? (
        <button
          type="button"
          className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() =>
            setCountryGroup(activeSuperpower, country.iso_a3, "unclassified")
          }
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}
