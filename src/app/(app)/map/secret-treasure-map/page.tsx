"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const TreasureMapView = dynamic(
  () => import("@/components/treasure-map/treasure-map-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100svh-3rem)] w-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  },
);

export default function SecretTreasureMapPage() {
  return <TreasureMapView />;
}
