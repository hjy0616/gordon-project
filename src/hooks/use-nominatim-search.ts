"use client";

import { useState, useEffect } from "react";
import { searchAddress, parseKoreanAddress } from "@/lib/nominatim";
import type { NominatimSearchResult } from "@/lib/nominatim";

export interface SearchResultItem {
  raw: NominatimSearchResult;
  lat: number;
  lng: number;
  region: string;
  displayName: string;
}

export function useNominatimSearch(query: string) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await searchAddress(trimmed);
        if (cancelled) return;

        if (data.length === 0) {
          setResults([]);
          setError("검색 결과 없음");
        } else {
          setResults(
            data.map((r) => ({
              raw: r,
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
              region: parseKoreanAddress(r.address),
              displayName: r.display_name,
            })),
          );
          setError(null);
        }
      } catch {
        if (cancelled) return;
        setResults([]);
        setError("연결 오류");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, isLoading, error };
}
