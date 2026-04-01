"use client";

import dynamic from "next/dynamic";
import { MapLoading } from "@/components/macro-map/map-loading";

const MacroMapView = dynamic(
  () =>
    import("@/components/macro-map/macro-map-view").then(
      (mod) => mod.MacroMapView
    ),
  { ssr: false, loading: () => <MapLoading /> }
);

export default function MacroMapPage() {
  return <MacroMapView />;
}
