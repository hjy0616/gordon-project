"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { fetchFromServer } from "@/lib/api-sync";
import type { CapitalFlow, CountryRelation } from "@/types/macro-map";

export function useMacroMapSync() {
  const { status } = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function hydrate() {
      const [notes, edits, flows, relations] = await Promise.all([
        fetchFromServer<Record<string, { note: string; continentTag: string | null }>>(
          "/api/macro-map/notes"
        ),
        fetchFromServer<Record<string, Record<string, unknown>>>(
          "/api/macro-map/country-edits"
        ),
        fetchFromServer<CapitalFlow[]>("/api/macro-map/flows"),
        fetchFromServer<CountryRelation[]>("/api/macro-map/relations"),
      ]);

      const state = useMacroMapStore.getState();

      if (notes) {
        const noteMap: Record<string, string> = {};
        const tagMap: Record<string, string> = {};
        for (const [iso, data] of Object.entries(notes)) {
          if (data.note) noteMap[iso] = data.note;
          if (data.continentTag) tagMap[iso] = data.continentTag;
        }
        if (Object.keys(noteMap).length > 0) {
          useMacroMapStore.setState({ notes: { ...state.notes, ...noteMap } });
        }
        if (Object.keys(tagMap).length > 0) {
          useMacroMapStore.setState({
            continentTags: { ...state.continentTags, ...tagMap },
          });
        }
      }

      if (edits && Object.keys(edits).length > 0) {
        useMacroMapStore.setState({
          countryEdits: { ...state.countryEdits, ...edits },
        });
      }

      if (flows && flows.length > 0) {
        // 하위 호환: color/lineStyle 없는 기존 데이터에 기본값 주입
        const hydratedFlows = flows.map((f) => ({
          ...f,
          color: f.color ?? "#e67e22",
          lineStyle: f.lineStyle ?? ("dashed" as const),
        }));
        useMacroMapStore.setState({ capitalFlows: hydratedFlows });
      }

      if (relations && relations.length > 0) {
        // 하위 호환: color/lineStyle 없는 기존 데이터에 기본값 주입
        const hydratedRelations = relations.map((r) => ({
          ...r,
          color: r.color ?? (r.type === "ally" ? "#3b82f6" : "#800020"),
          lineStyle: r.lineStyle ?? (r.type === "ally" ? "solid" as const : "dashed" as const),
        }));
        useMacroMapStore.setState({ relations: hydratedRelations });
      }

      setHydrated(true);
    }

    hydrate();
  }, [status]);

  return { hydrated, isAuthenticated: status === "authenticated" };
}
