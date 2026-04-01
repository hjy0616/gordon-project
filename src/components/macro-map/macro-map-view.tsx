"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { MapContainer } from "./map-container";
import { IndicatorSwitcher } from "./indicator-switcher";
import { MapLegend } from "./map-legend";
import { CountryPanel } from "./country-panel";
import { CountryPanelMobile } from "./country-panel-mobile";
import { CountryRankingPanel } from "./country-ranking-panel";
import { ScorecardPanel } from "./scorecard-panel";
import { RelationPopover } from "./relation-popover";
import { FlowPopover } from "./flow-popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { Button } from "@/components/ui/button";
import { Globe, Target } from "lucide-react";

const SimulationView = dynamic(
  () =>
    import("./simulation/simulation-view").then((m) => m.SimulationView),
  { ssr: false },
);

export function MacroMapView() {
  const isMobile = useIsMobile();
  const activeTab = useMacroMapStore((s) => s.activeTab);
  const setActiveTab = useMacroMapStore((s) => s.setActiveTab);
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const showRanking = useMacroMapStore((s) => s.showRanking);
  const showScorecard = useMacroMapStore((s) => s.showScorecard);
  const relationEditMode = useMacroMapStore((s) => s.relationEditMode);
  const relationPopover = useMacroMapStore((s) => s.relationPopover);
  const flowEditMode = useMacroMapStore((s) => s.flowEditMode);
  const flowPopover = useMacroMapStore((s) => s.flowPopover);

  // ESC 키 핸들링 (편집 모드)
  useEffect(() => {
    if (!relationEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useMacroMapStore.getState();
      if (st.relationPopover) {
        st.hideRelationPopover();
      } else if (st.relationEditBase) {
        st.setRelationEditBase(null);
      } else {
        st.toggleRelationEditMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [relationEditMode]);

  // ESC 키 핸들링 (자본흐름 편집 모드)
  useEffect(() => {
    if (!flowEditMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useMacroMapStore.getState();
      if (st.flowPopover) {
        st.hideFlowPopover();
      } else if (st.flowEditBase) {
        st.setFlowEditBase(null);
      } else {
        st.toggleFlowEditMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flowEditMode]);

  return (
    <div className="relative -m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] flex-col overflow-hidden">
      {/* 탭 스위처 */}
      <div className="pointer-events-auto absolute left-4 top-4 z-20 flex gap-1 rounded-lg border border-border bg-background/80 p-1 backdrop-blur-sm">
        <Button
          variant={activeTab === "map" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("map")}
          className="gap-1.5"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">지도</span>
        </Button>
        <Button
          variant={activeTab === "simulation" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("simulation")}
          className="gap-1.5"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">시뮬레이션</span>
        </Button>
      </div>

      {activeTab === "map" ? (
        <div className="relative flex-1 overflow-hidden">
          <MapContainer />

          <div className="pointer-events-none absolute inset-0 z-10">
            {/* Top-left: Indicator Switcher (탭 아래) */}
            <div className="pointer-events-auto absolute left-4 top-14">
              <IndicatorSwitcher />
            </div>

            {/* Left: Country Ranking Panel */}
            {showRanking && (
              <div className="pointer-events-auto absolute left-4 top-[6.5rem]">
                <CountryRankingPanel />
              </div>
            )}

            {/* Scorecard overlay */}
            {showScorecard && (
              <div className="pointer-events-auto absolute inset-0">
                <ScorecardPanel />
              </div>
            )}

            {/* Bottom-left: Legend (패널이 열려 있으면 숨김) */}
            {!showRanking && !showScorecard && (
              <div className="pointer-events-auto absolute bottom-4 left-4">
                <MapLegend />
              </div>
            )}

            {/* Country Panel (일반 모드에서만) */}
            {selectedCountry && !relationEditMode && !flowEditMode && (
              <div className="pointer-events-auto">
                {isMobile ? <CountryPanelMobile /> : <CountryPanel />}
              </div>
            )}

            {/* Relation Popover (편집 모드) */}
            {relationPopover && relationEditMode && (
              <div className="pointer-events-auto">
                <RelationPopover />
              </div>
            )}

            {/* Flow Popover (자본흐름 편집 모드) */}
            {flowPopover && flowEditMode && (
              <div className="pointer-events-auto">
                <FlowPopover />
              </div>
            )}
          </div>
        </div>
      ) : (
        <SimulationView />
      )}
    </div>
  );
}
