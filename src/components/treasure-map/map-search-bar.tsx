"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import { useNominatimSearch } from "@/hooks/use-nominatim-search";
import type { SearchResultItem } from "@/hooks/use-nominatim-search";

interface MapSearchBarProps {
  onSelect: (result: SearchResultItem) => void;
}

export function MapSearchBar({ onSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading, error } = useNominatimSearch(query);

  const showDropdown = isOpen && query.trim().length >= 2;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: SearchResultItem) {
    onSelect(result);
    setQuery(result.region);
    setIsOpen(false);
  }

  function handleClear() {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-1/2 z-20 w-[min(400px,calc(100%-1.5rem))] -translate-x-1/2"
    >
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        {/* Input */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5">
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="주소 검색 (예: 분당구 정자동)"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="border-t border-border">
            {results.length > 0
              ? results.map((result) => (
                  <button
                    key={result.raw.place_id}
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-accent/50"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm text-foreground">
                        {result.region}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {result.displayName}
                      </div>
                    </div>
                  </button>
                ))
              : error && (
                  <div className="px-3.5 py-3 text-center text-sm text-muted-foreground">
                    {error}
                  </div>
                )}
          </div>
        )}
      </div>
    </div>
  );
}
