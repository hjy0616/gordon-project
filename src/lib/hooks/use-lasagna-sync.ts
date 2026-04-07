"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { fetchFromServer } from "@/lib/api-sync";
import type { Simulation } from "@/types/lasagna";

export function useLasagnaSync() {
  const { status } = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function hydrate() {
      const simulations = await fetchFromServer<Simulation[]>(
        "/api/lasagna/simulations",
      );

      if (simulations && simulations.length > 0) {
        useLasagnaStore.setState({ simulations });
      }

      setHydrated(true);
    }

    hydrate();
  }, [status]);

  return { hydrated, isAuthenticated: status === "authenticated" };
}
