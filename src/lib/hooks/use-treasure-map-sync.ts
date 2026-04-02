"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { fetchFromServer } from "@/lib/api-sync";
import type { CustomDistrict, DistrictEdits, DistrictOverrides } from "@/types/treasure-map";

export function useTreasureMapSync() {
  const { status } = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function hydrate() {
      const [districts, notes, edits, overrides, prefs] = await Promise.all([
        fetchFromServer<CustomDistrict[]>("/api/treasure-map/districts"),
        fetchFromServer<Record<string, string>>("/api/treasure-map/notes"),
        fetchFromServer<Record<string, DistrictEdits>>("/api/treasure-map/edits"),
        fetchFromServer<Record<string, DistrictOverrides>>("/api/treasure-map/overrides"),
        fetchFromServer<{ adoptionRate: number; deletedMockIds: string[] }>(
          "/api/treasure-map/preferences"
        ),
      ]);

      if (districts && districts.length > 0) {
        useTreasureMapStore.setState({ customDistricts: districts });
      }

      if (notes && Object.keys(notes).length > 0) {
        useTreasureMapStore.setState({ districtNotes: notes });
      }

      if (edits && Object.keys(edits).length > 0) {
        useTreasureMapStore.setState({ districtEdits: edits });
      }

      if (overrides && Object.keys(overrides).length > 0) {
        useTreasureMapStore.setState({ districtOverrides: overrides });
      }

      if (prefs) {
        useTreasureMapStore.setState({
          adoptionRate: prefs.adoptionRate,
          deletedMockIds: prefs.deletedMockIds,
        });
      }

      setHydrated(true);
    }

    hydrate();
  }, [status]);

  return { hydrated, isAuthenticated: status === "authenticated" };
}
