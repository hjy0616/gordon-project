"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { CountryIndicators, CountryGroupType } from "@/types/macro-map";
import { DraggableCountryCard } from "./draggable-country-card";

const GROUP_STYLES: Record<
  CountryGroupType,
  { border: string; headerBg: string; icon: string }
> = {
  unclassified: {
    border: "border-dashed border-muted-foreground/30",
    headerBg: "bg-muted/30",
    icon: "📋",
  },
  needed: {
    border: "border-blue-500/40",
    headerBg: "bg-blue-500/10",
    icon: "✅",
  },
  unnecessary: {
    border: "border-red-500/40",
    headerBg: "bg-red-500/10",
    icon: "❌",
  },
};

interface CountryGroupColumnProps {
  groupType: CountryGroupType;
  title: string;
  countries: CountryIndicators[];
}

export function CountryGroupColumn({
  groupType,
  title,
  countries,
}: CountryGroupColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: groupType });
  const styles = GROUP_STYLES[groupType];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col rounded-lg border transition-colors",
        styles.border,
        isOver && "border-primary bg-primary/5",
      )}
    >
      {/* 헤더 */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-lg border-b px-3 py-2",
          styles.headerBg,
        )}
      >
        <span>{styles.icon}</span>
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {countries.length}
        </span>
      </div>

      {/* 국가 카드 리스트 */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        <SortableContext
          items={countries.map((c) => c.iso_a3)}
          strategy={verticalListSortingStrategy}
        >
          {countries.map((c) => (
            <DraggableCountryCard key={c.iso_a3} country={c} groupType={groupType} />
          ))}
        </SortableContext>

        {countries.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-muted-foreground/20 text-xs text-muted-foreground">
            국가를 여기로 드래그하세요
          </div>
        )}
      </div>
    </div>
  );
}
