"use client";

import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { SimulationHeader } from "./simulation-header";
import { G2PerspectivePanel } from "./g2-perspective-panel";
import { CountryGroupingPanel } from "./country-grouping-panel";
import { IssueTrackingBar } from "./issue-tracking-bar";
import { IssueEditorSheet } from "./issue-editor";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function SimulationView() {
  const isMobile = useIsMobile();
  const expandedIssueId = useMacroMapStore((s) => s.expandedIssueId);

  // ESC 키 핸들링 (시뮬레이션 탭)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const st = useMacroMapStore.getState();
      if (st.expandedIssueId) {
        st.setExpandedIssue(null);
      } else if (st.issueBarExpanded) {
        st.toggleIssueBar();
      } else {
        st.setActiveTab("map");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto pt-14">
        <SimulationHeader />
        <G2PerspectivePanel />
        <CountryGroupingPanel />
        <IssueTrackingBar />

        {/* 모바일: 이슈 에디터를 Sheet로 */}
        <Sheet
          open={!!expandedIssueId}
          onOpenChange={(open) => {
            if (!open) useMacroMapStore.getState().setExpandedIssue(null);
          }}
        >
          <SheetContent side="bottom" className="max-h-[80svh] overflow-y-auto">
            <SheetTitle className="sr-only">이슈 편집</SheetTitle>
            {expandedIssueId && <IssueEditorSheet issueId={expandedIssueId} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden pt-14">
      <SimulationHeader />
      <div className="flex flex-1 overflow-hidden">
        <G2PerspectivePanel />
        <div className="w-px bg-border" />
        <CountryGroupingPanel />
      </div>
      <IssueTrackingBar />
    </div>
  );
}
