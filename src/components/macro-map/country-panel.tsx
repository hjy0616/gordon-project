"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { COUNTRY_MAP } from "@/data/mock-countries";
import { getCountryInfo } from "@/data/country-names";
import { CountryDetailSection } from "./country-detail-section";
import { CountryQualitativeSection } from "./country-qualitative-section";
import { CountryCapabilitiesSection } from "./country-capabilities-section";

const INDICATOR_LABELS = [
  { key: "gdp_growth", label: "GDP 성장률", unit: "%" },
  { key: "interest_rate", label: "기준금리", unit: "%" },
  { key: "inflation", label: "인플레이션", unit: "%" },
  { key: "gdp_nominal", label: "명목 GDP", unit: "B$" },
  { key: "unemployment", label: "실업률", unit: "%" },
  { key: "debt_to_gdp", label: "부채/GDP", unit: "%" },
  { key: "current_account", label: "경상수지", unit: "%" },
] as const;

export function CountryPanel() {
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const selectedCountryName = useMacroMapStore((s) => s.selectedCountryName);
  const notes = useMacroMapStore((s) => s.notes);
  const updateNote = useMacroMapStore((s) => s.updateNote);
  const selectCountry = useMacroMapStore((s) => s.selectCountry);

  // Mock data (may be null for countries without data)
  const mockData = selectedCountry ? COUNTRY_MAP.get(selectedCountry) : null;
  // Basic info (always available for any country)
  const info = selectedCountry
    ? getCountryInfo(selectedCountry, selectedCountryName ?? undefined)
    : null;

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [prevCountry, setPrevCountry] = useState(selectedCountry);
  const [noteText, setNoteText] = useState(
    selectedCountry ? notes[selectedCountry] || "" : ""
  );

  if (selectedCountry !== prevCountry) {
    setPrevCountry(selectedCountry);
    setNoteText(selectedCountry ? notes[selectedCountry] || "" : "");
  }

  const handleNoteChange = useCallback(
    (value: string) => {
      setNoteText(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (selectedCountry) updateNote(selectedCountry, value);
      }, 300);
    },
    [selectedCountry, updateNote]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") selectCountry(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectCountry]);

  if (!info) return null;

  return (
    <div
      className="absolute right-0 top-0 h-full w-96 transform border-l border-border bg-background/95 backdrop-blur-md transition-transform duration-300"
      style={{
        transform: selectedCountry ? "translateX(0)" : "translateX(100%)",
      }}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.flag_emoji}</span>
            <div>
              <h2 className="font-semibold">{info.name_ko}</h2>
              <p className="text-xs text-muted-foreground">{info.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => selectCountry(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Indicators */}
        <div className="border-b border-border p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            핵심 경제 지표
          </h3>
          {mockData ? (
            <div className="grid grid-cols-2 gap-3">
              {INDICATOR_LABELS.map(({ key, label, unit }) => {
                const value = mockData[
                  key as keyof typeof mockData
                ] as number;
                return (
                  <div
                    key={key}
                    className="rounded-md border border-border bg-card px-3 py-2"
                  >
                    <div className="text-xs text-muted-foreground">
                      {label}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold tabular-nums">
                      {key === "gdp_nominal"
                        ? `$${value.toLocaleString()}`
                        : `${value > 0 && key !== "unemployment" && key !== "debt_to_gdp" ? "+" : ""}${value.toFixed(1)}`}
                      <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                        {unit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              경제 지표 데이터가 아직 없습니다.
              <br />
              <span className="text-xs">
                백엔드 연동 시 자동으로 표시됩니다.
              </span>
            </div>
          )}
        </div>

        {/* Detail Data (Stage 3) */}
        <CountryDetailSection iso={selectedCountry!} />

        {/* Qualitative Data (Stage 4) */}
        <CountryQualitativeSection iso={selectedCountry!} />

        {/* Core Capabilities (Stage 6) */}
        <CountryCapabilitiesSection iso={selectedCountry!} />

        {/* Notes */}
        <div className="flex-1 p-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            분석 노트
          </h3>
          <textarea
            value={noteText}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder={`${info.name_ko}에 대한 경제 분석 메모를 작성하세요...`}
            className="h-40 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            자동 저장됩니다 (localStorage)
          </p>
        </div>
      </div>
    </div>
  );
}
