"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { MOCK_COUNTRIES } from "@/data/mock-countries";
import { DEFAULT_CONTINENT_TAGS } from "@/data/country-continents";
import { CONTINENT_OPTIONS } from "@/types/macro-map";

const SORTED_COUNTRIES = [...MOCK_COUNTRIES].sort(
  (a, b) => b.gdp_nominal - a.gdp_nominal
);

export function CountryRankingPanel() {
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const selectCountry = useMacroMapStore((s) => s.selectCountry);
  const toggleRanking = useMacroMapStore((s) => s.toggleRanking);
  const continentTags = useMacroMapStore((s) => s.continentTags);
  const setContinentTag = useMacroMapStore((s) => s.setContinentTag);

  const [editingIso, setEditingIso] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setEditingIso(null);
      }
    }
    if (editingIso) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [editingIso]);

  function getContinent(iso: string): string {
    return continentTags[iso] ?? DEFAULT_CONTINENT_TAGS[iso] ?? "미분류";
  }

  return (
    <div className="flex max-h-[calc(100svh-10rem)] w-72 flex-col rounded-lg border border-border bg-background/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-semibold">세계 경제 순위</h3>
        <Button variant="ghost" size="icon-sm" onClick={toggleRanking}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      <div className="overflow-y-auto">
        {SORTED_COUNTRIES.map((country, idx) => {
          const isSelected = selectedCountry === country.iso_a3;
          const continent = getContinent(country.iso_a3);

          return (
            <div
              key={country.iso_a3}
              className={`relative flex cursor-pointer items-center gap-2.5 border-b border-border/50 px-3 py-2 transition-colors hover:bg-accent/50 ${
                isSelected ? "bg-accent" : ""
              }`}
              onClick={() => selectCountry(country.iso_a3, country.name)}
            >
              {/* Rank */}
              <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">
                {idx + 1}
              </span>

              {/* Flag + Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{country.flag_emoji}</span>
                  <span className="truncate text-sm font-medium">
                    {country.name_ko}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  ${country.gdp_nominal.toLocaleString()}B
                </div>
              </div>

              {/* Continent Tag */}
              <div className="relative" ref={editingIso === country.iso_a3 ? dropdownRef : undefined}>
                <button
                  type="button"
                  className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingIso(
                      editingIso === country.iso_a3 ? null : country.iso_a3
                    );
                  }}
                >
                  {continent}
                </button>

                {editingIso === country.iso_a3 && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-28 rounded-md border border-border bg-popover py-1 shadow-lg">
                    {CONTINENT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`block w-full px-3 py-1 text-left text-xs transition-colors hover:bg-accent ${
                          continent === opt
                            ? "font-medium text-primary"
                            : "text-popover-foreground"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setContinentTag(country.iso_a3, opt);
                          setEditingIso(null);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
