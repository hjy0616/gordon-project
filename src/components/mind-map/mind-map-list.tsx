"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMindMaps, useDebouncedCallback } from "@/lib/queries/use-mind-maps";
import { MindMapListItem } from "./mind-map-list-item";
import { NewMindMapButton } from "./new-mind-map-button";
import { MindMapListEmpty } from "./mind-map-list-empty";

export function MindMapList() {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const debouncedSetQ = useDebouncedCallback((value: string) => {
    setQ(value);
  }, 250);

  const { data, isLoading } = useMindMaps({ q, favoritesOnly });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="제목 또는 노드 텍스트 검색"
            value={qInput}
            onChange={(e) => {
              setQInput(e.target.value);
              debouncedSetQ(e.target.value.trim());
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFavoritesOnly((v) => !v)}
            aria-pressed={favoritesOnly}
            className="gap-1.5"
          >
            <Star
              className="size-4"
              fill={favoritesOnly ? "currentColor" : "none"}
              aria-hidden
            />
            <span className="hidden sm:inline">별표</span>
          </Button>
          <NewMindMapButton />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <MindMapListEmpty filtered={Boolean(q || favoritesOnly)} />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data.map((m) => (
            <MindMapListItem key={m.id} item={m} />
          ))}
        </ul>
      )}
    </div>
  );
}
