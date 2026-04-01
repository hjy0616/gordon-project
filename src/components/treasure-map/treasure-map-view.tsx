"use client";

import { MapContainer } from "./map-container";
import { MapLegend } from "./map-legend";
import { DistrictPanel } from "./district-panel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { resolveDistrict } from "@/lib/treasure-map-utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function TreasureMapView() {
  const isMobile = useIsMobile();
  const selectedDistrict = useTreasureMapStore((s) => s.selectedDistrict);
  const selectDistrict = useTreasureMapStore((s) => s.selectDistrict);
  const panelMode = useTreasureMapStore((s) => s.panelMode);
  const setPanelMode = useTreasureMapStore((s) => s.setPanelMode);
  const customDistricts = useTreasureMapStore((s) => s.customDistricts);
  const districtOverrides = useTreasureMapStore((s) => s.districtOverrides);

  const hasSelectedDistrict =
    selectedDistrict &&
    !!resolveDistrict(selectedDistrict, customDistricts, districtOverrides);

  // Mobile sheet opens for: selected district, create mode, or list mode
  const sheetOpen =
    !!hasSelectedDistrict ||
    panelMode === "create" ||
    panelMode === "list";

  return (
    <div className="relative -m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] overflow-hidden">
      {/* Map */}
      <div className={isMobile ? "relative w-full" : "relative w-[65%]"}>
        <MapContainer />
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto absolute bottom-4 left-4">
            <MapLegend />
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {isMobile ? (
        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              selectDistrict(null);
              setPanelMode("list");
            }
          }}
        >
          <SheetContent
            side="bottom"
            className="max-h-[75svh] overflow-y-auto hide-native-scrollbar p-4"
          >
            <DistrictPanel />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-[35%] border-l border-border">
          <DistrictPanel />
        </div>
      )}
    </div>
  );
}

export default TreasureMapView;
