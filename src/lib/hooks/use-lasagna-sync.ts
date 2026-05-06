"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLasagnaStore, hasPendingCreate } from "@/lib/stores/lasagna-store";
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

      // null = fetch 실패. 그 외(빈 배열 포함)는 서버가 source of truth이므로 덮어쓴다.
      // 빈 배열 케이스를 스킵하면 zustand persist에 남은 stale sim(다른 유저 데이터,
      // 삭제됐는데 다른 기기에서 미반영, 마이그레이션 후 등)이 살아남아 PUT 시
      // 0-row warn이 끝없이 발생한다.
      // 단, 현재 in-flight POST 중인 신규 sim은 서버가 아직 모르므로 보존.
      if (simulations !== null) {
        const local = useLasagnaStore.getState().simulations;
        const inFlight = local.filter((s) => hasPendingCreate(s.id));
        const inFlightIds = new Set(inFlight.map((s) => s.id));
        const merged = [
          ...inFlight,
          ...simulations.filter((s) => !inFlightIds.has(s.id)),
        ];
        useLasagnaStore.setState({ simulations: merged });
      }

      setHydrated(true);
    }

    hydrate();
  }, [status]);

  return { hydrated, isAuthenticated: status === "authenticated" };
}
