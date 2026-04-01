"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryDetail } from "@/data/mock-country-details";
import { DETAIL_FIELD_CONFIG } from "@/types/macro-map";
import type { CountryEditableData } from "@/types/macro-map";

type DetailKey = (typeof DETAIL_FIELD_CONFIG)[number]["key"];

export function CountryDetailSection({ iso }: { iso: string }) {
  const countryEdits = useMacroMapStore((s) => s.countryEdits);
  const updateCountryEdit = useMacroMapStore((s) => s.updateCountryEdit);

  const detail = getCountryDetail(iso, countryEdits);

  const [localValues, setLocalValues] = useState<Record<string, string>>(() =>
    buildLocalValues(detail),
  );
  const debounceMap = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const [prevIso, setPrevIso] = useState(iso);
  if (iso !== prevIso) {
    setPrevIso(iso);
    const newDetail = getCountryDetail(iso, countryEdits);
    setLocalValues(buildLocalValues(newDetail));
  }

  const handleChange = useCallback(
    (field: DetailKey, raw: string) => {
      setLocalValues((prev) => ({ ...prev, [field]: raw }));

      const existing = debounceMap.current.get(field);
      if (existing) clearTimeout(existing);

      debounceMap.current.set(
        field,
        setTimeout(() => {
          const num = raw === "" ? null : Number(raw);
          if (raw !== "" && isNaN(num as number)) return;
          updateCountryEdit(
            iso,
            field as keyof CountryEditableData,
            num as CountryEditableData[keyof CountryEditableData],
          );
        }, 300),
      );
    },
    [iso, updateCountryEdit],
  );

  return (
    <div className="border-b border-border">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          국가 상세 데이터
          <ChevronDown className="h-4 w-4 transition-transform [[data-panel-open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 px-4 pb-4">
            {DETAIL_FIELD_CONFIG.map(({ key, label, unit }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="w-20 shrink-0 text-xs text-muted-foreground">
                  {label}
                </label>
                <Input
                  type="number"
                  value={localValues[key] ?? ""}
                  onChange={(e) =>
                    handleChange(key as DetailKey, e.target.value)
                  }
                  className="h-7 flex-1 text-sm tabular-nums"
                  placeholder="—"
                />
                <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground">
                  {unit}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function buildLocalValues(
  detail: ReturnType<typeof getCountryDetail>,
): Record<string, string> {
  const vals: Record<string, string> = {};
  for (const { key } of DETAIL_FIELD_CONFIG) {
    const v = detail?.[key as keyof typeof detail];
    vals[key] = v != null ? String(v) : "";
  }
  return vals;
}
