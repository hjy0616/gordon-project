"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { useTreasureMapSync } from "@/lib/hooks/use-treasure-map-sync";

const TreasureMapView = dynamic(
  () => import("@/components/treasure-map/treasure-map-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export default function SecretTreasureMapPage() {
  useTreasureMapSync();
  return <TreasureMapView />;
}
