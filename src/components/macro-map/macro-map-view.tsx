"use client";

import { useEffect } from "react";
import { MapContainer } from "./map-container";
import { IndicatorSwitcher } from "./indicator-switcher";
import { MapLegend } from "./map-legend";
import { CountryPanel } from "./country-panel";
import { CountryPanelMobile } from "./country-panel-mobile";
import { CountryRankingPanel } from "./country-ranking-panel";
import { ScorecardPanel } from "./scorecard-panel";
import { EditPopover } from "./edit-popover";
import { NoteTooltip } from "./note-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";

export function MacroMapView() {
  const isMobile = useIsMobile();
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const showRanking = useMacroMapStore((s) => s.showRanking);
  const showScorecard = useMacroMapStore((s) => s.showScorecard);
  const editMode = useMacroMapStore((s) => s.editMode);
  const editPopover = useMacroMapStore((s) => s.editPopover);

  // ESC 키 핸들링 (통합 편집 모드)
  useEffect(() => {
    if (!editMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useMacroMapStore.getState();
      if (st.editPopover) {
        st.hideEditPopover();
      } else if (st.editBase) {
        st.setEditBase(null);
      } else {
        st.toggleEditMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode]);

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
          {selectedCountry && !editMode && (
            <div className="pointer-events-auto">
              {isMobile ? <CountryPanelMobile /> : <CountryPanel />}
            </div>
          )}

          {/* 통합 편집 팝오버 */}
          {editPopover && editMode && (
            <div className="pointer-events-auto">
              <EditPopover />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
