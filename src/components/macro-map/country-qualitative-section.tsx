"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronDown, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryDetail } from "@/data/mock-country-details";
import { useCountryDetails } from "@/lib/queries/use-country-data";

export function CountryQualitativeSection({ iso }: { iso: string }) {
  const countryEdits = useMacroMapStore((s) => s.countryEdits);
  const updateCountryEdit = useMacroMapStore((s) => s.updateCountryEdit);

  const { data: detailsRes } = useCountryDetails();
  const detail = getCountryDetail(iso, countryEdits, detailsRes?.data);
  const industries = detail?.key_industries ?? [];
  const techCapability = detail?.tech_capability ?? "";
  const militaryRank = detail?.military_rank ?? null;

  // Local state for text fields with debounce
  const [localTech, setLocalTech] = useState(techCapability);
  const [localRank, setLocalRank] = useState(
    militaryRank != null ? String(militaryRank) : "",
  );
  const [addingIndustry, setAddingIndustry] = useState(false);
  const [newIndustry, setNewIndustry] = useState("");

  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Reset on country change
  const [prevIso, setPrevIso] = useState(iso);
  if (iso !== prevIso) {
    setPrevIso(iso);
    const d = getCountryDetail(iso, countryEdits, detailsRes?.data);
    setLocalTech(d?.tech_capability ?? "");
    setLocalRank(d?.military_rank != null ? String(d.military_rank) : "");
    setAddingIndustry(false);
    setNewIndustry("");
  }

  const debouncedUpdate = useCallback(
    (field: string, value: string, transform: (v: string) => unknown) => {
      const existing = debounceRef.current.get(field);
      if (existing) clearTimeout(existing);
      debounceRef.current.set(
        field,
        setTimeout(() => {
          updateCountryEdit(iso, field as "tech_capability", transform(value) as string);
        }, 300),
      );
    },
    [iso, updateCountryEdit],
  );

  function handleTechChange(value: string) {
    setLocalTech(value);
    debouncedUpdate("tech_capability", value, (v) => v);
  }

  function handleRankChange(value: string) {
    setLocalRank(value);
    debouncedUpdate("military_rank", value, (v) =>
      v === "" ? null : Number(v),
    );
  }

  function addIndustry() {
    const trimmed = newIndustry.trim();
    if (!trimmed) return;
    const updated = [...industries, trimmed];
    updateCountryEdit(iso, "key_industries", updated);
    setNewIndustry("");
    setAddingIndustry(false);
  }

  function removeIndustry(index: number) {
    const updated = industries.filter((_, i) => i !== index);
    updateCountryEdit(iso, "key_industries", updated);
  }

  return (
    <div className="border-b border-border">
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          산업 및 군사력
          <ChevronDown className="h-4 w-4 transition-transform [[data-panel-open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-3 px-4 pb-4">
            {/* 핵심 산업 */}
            <div>
              <div className="mb-1.5 text-xs text-muted-foreground">
                핵심 산업
              </div>
              <div className="flex flex-wrap gap-1.5">
                {industries.map((industry, idx) => (
                  <span
                    key={`${industry}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px]"
                  >
                    {industry}
                    <button
                      type="button"
                      onClick={() => removeIndustry(idx)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {addingIndustry ? (
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addIndustry();
                      if (e.key === "Escape") {
                        setAddingIndustry(false);
                        setNewIndustry("");
                      }
                    }}
                    onBlur={() => {
                      if (newIndustry.trim()) addIndustry();
                      else setAddingIndustry(false);
                    }}
                    placeholder="산업명 입력"
                    autoFocus
                    className="h-6 w-24 rounded-full border border-primary bg-transparent px-2 text-[11px] outline-none placeholder:text-muted-foreground"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingIndustry(true)}
                    className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    추가
                  </button>
                )}
              </div>
            </div>

            {/* 기술력 */}
            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-xs text-muted-foreground">
                기술력
              </label>
              <Input
                type="text"
                value={localTech}
                onChange={(e) => handleTechChange(e.target.value)}
                className="h-7 flex-1 text-sm"
                placeholder="예: 상위 (AI, 반도체)"
              />
            </div>

            {/* 군사력 순위 */}
            <div className="flex items-center gap-2">
              <label className="w-20 shrink-0 text-xs text-muted-foreground">
                군사력 순위
              </label>
              <Input
                type="number"
                min={1}
                value={localRank}
                onChange={(e) => handleRankChange(e.target.value)}
                className="h-7 w-20 text-sm tabular-nums"
                placeholder="—"
              />
              <span className="text-[10px] text-muted-foreground">위</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
