"use client";

import { useEffect } from "react";
import { MapContainer } from "./map-container";
import { IndicatorSwitcher } from "./indicator-switcher";
import { MapLegend } from "./map-legend";
import { CountryPanel } from "./country-panel";
import { CountryPanelMobile } from "./country-panel-mobile";
import { CountryRankingPanel } from "./country-ranking-panel";
import { ScorecardPanel } from "./scorecard-panel";
import { RelationPopover } from "./relation-popover";
import { FlowPopover } from "./flow-popover";
import { NoteTooltip } from "./note-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";

export function MacroMapView() {
  const isMobile = useIsMobile();
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
      <div className="relative flex-1 overflow-hidden">
        <MapContainer />

        <div className="pointer-events-none absolute inset-0 z-10">
          {/* Note Tooltip (hover) */}
          <NoteTooltip />

          {/* Top-left: Indicator Switcher */}
          <div className="pointer-events-auto absolute left-4 top-4">
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
    </div>
  );
}
