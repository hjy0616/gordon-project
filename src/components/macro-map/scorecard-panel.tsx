"use client";

import { useState, useMemo } from "react";
import { X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { FALLBACK_COUNTRIES } from "@/data/static-fallback";
import { useCountryIndicators } from "@/lib/queries/use-country-data";
import { getCountryDetail } from "@/data/mock-country-details";
import { useCountryDetails } from "@/lib/queries/use-country-data";
import { DEFAULT_CONTINENT_TAGS } from "@/data/country-continents";
import { useIsMobile } from "@/hooks/use-mobile";

/* ------------------------------------------------------------------ */
/*  Column config                                                      */
/* ------------------------------------------------------------------ */

type SortKey =
  | "country"
  | "continent"
  | "gdp"
  | "gni"
  | "gni_per_capita"
  | "population"
  | "national_debt"
  | "military_rank";

const COLUMNS: {
  key: SortKey | "rank";
  label: string;
  unit: string;
  align: "left" | "right";
  sortable: boolean;
}[] = [
  { key: "rank", label: "#", unit: "", align: "right", sortable: false },
  { key: "country", label: "국가", unit: "", align: "left", sortable: true },
  { key: "continent", label: "대륙", unit: "", align: "left", sortable: true },
  { key: "gdp", label: "GDP", unit: "십억$", align: "right", sortable: true },
  { key: "gni", label: "GNI", unit: "십억$", align: "right", sortable: true },
  { key: "gni_per_capita", label: "1인당 GNI", unit: "USD", align: "right", sortable: true },
  { key: "population", label: "인구", unit: "만 명", align: "right", sortable: true },
  { key: "national_debt", label: "국가채무", unit: "십억$", align: "right", sortable: true },
  { key: "military_rank", label: "군사력", unit: "위", align: "right", sortable: true },
];

const TEXT_KEYS = new Set<string>(["country", "continent"]);

/* ------------------------------------------------------------------ */
/*  Row type                                                           */
/* ------------------------------------------------------------------ */

interface ScorecardRow {
  iso: string;
  name: string;
  name_ko: string;
  flag_emoji: string;
  continent: string;
  gdp: number | null;
  gni: number | null;
  gni_per_capita: number | null;
  population: number | null;
  national_debt: number | null;
  military_rank: number | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScorecardPanel() {
  const isMobile = useIsMobile();
  const showScorecard = useMacroMapStore((s) => s.showScorecard);
  const toggleScorecard = useMacroMapStore((s) => s.toggleScorecard);
  const selectCountry = useMacroMapStore((s) => s.selectCountry);
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const countryEdits = useMacroMapStore((s) => s.countryEdits);
  const continentTags = useMacroMapStore((s) => s.continentTags);

  const { data: indicatorsRes } = useCountryIndicators();
  const countries = indicatorsRes?.data ?? FALLBACK_COUNTRIES;
  const { data: detailsRes } = useCountryDetails();

  const [sortKey, setSortKey] = useState<SortKey>("gdp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  /* ---------- data merge ---------- */
  const rows = useMemo<ScorecardRow[]>(() => {
    return countries.map((c) => {
      const detail = getCountryDetail(c.iso_a3, countryEdits, detailsRes?.data);
      return {
        iso: c.iso_a3,
        name: c.name,
        name_ko: c.name_ko,
        flag_emoji: c.flag_emoji,
        continent:
          continentTags[c.iso_a3] ??
          DEFAULT_CONTINENT_TAGS[c.iso_a3] ??
          "미분류",
        gdp: detail?.gdp ?? null,
        gni: detail?.gni ?? null,
        gni_per_capita: detail?.gni_per_capita ?? null,
        population: detail?.population ?? null,
        national_debt: detail?.national_debt ?? null,
        military_rank: detail?.military_rank ?? null,
      };
    });
  }, [countries, countryEdits, continentTags, detailsRes?.data]);

  /* ---------- sort ---------- */
  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "country") {
        cmp = a.name_ko.localeCompare(b.name_ko, "ko");
      } else if (sortKey === "continent") {
        cmp = a.continent.localeCompare(b.continent, "ko");
      } else {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) cmp = 0;
        else if (av == null) cmp = 1;
        else if (bv == null) cmp = -1;
        else cmp = av - bv;
      }
      // secondary: name_ko for stability
      if (cmp === 0) cmp = a.name_ko.localeCompare(b.name_ko, "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  /* ---------- sort handler ---------- */
  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(TEXT_KEYS.has(key) ? "asc" : "desc");
    }
  }

  /* ---------- sort icon ---------- */
  function SortIcon({ colKey }: { colKey: SortKey }) {
    if (colKey !== sortKey) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  }

  /* ---------- table content ---------- */
  const tableContent = (
    <div className="overflow-auto flex-1">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3 py-2.5 font-medium text-muted-foreground ${
                  col.align === "right" ? "text-right" : "text-left"
                } ${col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                onClick={
                  col.sortable
                    ? () => handleSort(col.key as SortKey)
                    : undefined
                }
              >
                {col.label}
                {col.unit && (
                  <span className="ml-1 text-[10px] text-muted-foreground/60">
                    {col.unit}
                  </span>
                )}
                {col.sortable && <SortIcon colKey={col.key as SortKey} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, idx) => (
            <tr
              key={row.iso}
              className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-accent/50 ${
                selectedCountry === row.iso ? "bg-accent" : ""
              }`}
              onClick={() => selectCountry(row.iso, row.name)}
            >
              {/* Rank */}
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {idx + 1}
              </td>
              {/* Country */}
              <td className="px-3 py-2 text-left">
                <span className="mr-1.5">{row.flag_emoji}</span>
                <span className="font-medium">{row.name_ko}</span>
              </td>
              {/* Continent */}
              <td className="px-3 py-2 text-left">
                <span className="inline-block rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px]">
                  {row.continent}
                </span>
              </td>
              {/* GDP */}
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(row.gdp)}
              </td>
              {/* GNI */}
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(row.gni)}
              </td>
              {/* GNI per capita */}
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(row.gni_per_capita)}
              </td>
              {/* Population */}
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(row.population)}
              </td>
              {/* National Debt */}
              <td className="px-3 py-2 text-right tabular-nums">
                {formatNumber(row.national_debt)}
              </td>
              {/* Military Rank */}
              <td className="px-3 py-2 text-right tabular-nums">
                {row.military_rank != null ? `${row.military_rank}위` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ---------- mobile: Sheet ---------- */
  if (isMobile) {
    return (
      <Sheet open={showScorecard} onOpenChange={(open) => { if (!open) toggleScorecard(); }}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[85svh] p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <SheetTitle className="text-sm font-semibold">종합 점수판</SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={toggleScorecard}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {tableContent}
        </SheetContent>
      </Sheet>
    );
  }

  /* ---------- desktop: overlay ---------- */
  return (
    <div className="absolute inset-x-4 top-16 bottom-4 flex flex-col rounded-lg border border-border bg-background/95 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">종합 점수판</h2>
        <Button variant="ghost" size="icon-sm" onClick={toggleScorecard}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      {tableContent}
    </div>
  );
}
