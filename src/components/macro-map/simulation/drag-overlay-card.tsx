"use client";

import { COUNTRY_MAP } from "@/data/mock-countries";
import { getCountryInfo } from "@/data/country-names";

interface DragOverlayCardProps {
  iso: string;
}

export function DragOverlayCard({ iso }: DragOverlayCardProps) {
  const info = getCountryInfo(iso);
  const data = COUNTRY_MAP.get(iso);

  return (
    <div className="flex items-center gap-2 rounded-md border border-primary bg-card px-3 py-2 shadow-lg ring-2 ring-primary">
      <span className="text-base">{info.flag_emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {info.name_ko}
        </div>
        {data && (
          <div className="text-[10px] text-muted-foreground">
            ${data.gdp_nominal}B GDP
          </div>
        )}
      </div>
    </div>
  );
}
