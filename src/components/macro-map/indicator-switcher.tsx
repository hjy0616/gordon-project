"use client";

import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { Button } from "@/components/ui/button";
import { INDICATOR_CONFIG, type IndicatorType } from "@/types/macro-map";
import {
  Activity,
  TrendingUp,
  Percent,
  Route,
  ListOrdered,
  LayoutGrid,
  GitBranch,
  Link,
} from "lucide-react";

const INDICATOR_ICONS: Record<IndicatorType, React.ReactNode> = {
  gdp_growth: <TrendingUp className="h-4 w-4" />,
  interest_rate: <Percent className="h-4 w-4" />,
  inflation: <Activity className="h-4 w-4" />,
};

export function IndicatorSwitcher() {
  const activeIndicator = useMacroMapStore((s) => s.activeIndicator);
  const setIndicator = useMacroMapStore((s) => s.setIndicator);
  const showFlows = useMacroMapStore((s) => s.showFlows);
  const toggleFlows = useMacroMapStore((s) => s.toggleFlows);
  const showRanking = useMacroMapStore((s) => s.showRanking);
  const toggleRanking = useMacroMapStore((s) => s.toggleRanking);
  const showScorecard = useMacroMapStore((s) => s.showScorecard);
  const toggleScorecard = useMacroMapStore((s) => s.toggleScorecard);
  const showRelations = useMacroMapStore((s) => s.showRelations);
  const toggleRelations = useMacroMapStore((s) => s.toggleRelations);
  const relationEditMode = useMacroMapStore((s) => s.relationEditMode);
  const toggleRelationEditMode = useMacroMapStore(
    (s) => s.toggleRelationEditMode,
  );
  const flowEditMode = useMacroMapStore((s) => s.flowEditMode);
  const toggleFlowEditMode = useMacroMapStore((s) => s.toggleFlowEditMode);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 p-1.5 backdrop-blur-sm">
      {(Object.keys(INDICATOR_CONFIG) as IndicatorType[]).map((key) => (
        <Button
          key={key}
          variant={activeIndicator === key ? "default" : "ghost"}
          size="sm"
          onClick={() => setIndicator(key)}
          className="gap-1.5"
        >
          {INDICATOR_ICONS[key]}
          <span className="hidden sm:inline">{INDICATOR_CONFIG[key].label}</span>
        </Button>
      ))}

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={showFlows ? "default" : "ghost"}
        size="sm"
        onClick={toggleFlows}
        className="gap-1.5"
      >
        <Route className="h-4 w-4" />
        <span className="hidden sm:inline">자본 흐름</span>
      </Button>

      <Button
        variant={showRelations ? "default" : "ghost"}
        size="sm"
        onClick={toggleRelations}
        className="gap-1.5"
      >
        <GitBranch className="h-4 w-4" />
        <span className="hidden sm:inline">관계선</span>
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={showRanking ? "default" : "ghost"}
        size="sm"
        onClick={toggleRanking}
        className="gap-1.5"
      >
        <ListOrdered className="h-4 w-4" />
        <span className="hidden sm:inline">국가 순위</span>
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={showScorecard ? "default" : "ghost"}
        size="sm"
        onClick={toggleScorecard}
        className="gap-1.5"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">점수판</span>
      </Button>

      <div className="mx-1 h-6 w-px bg-border" />

      <Button
        variant={flowEditMode ? "default" : "ghost"}
        size="sm"
        onClick={toggleFlowEditMode}
        className={
          flowEditMode
            ? "gap-1.5 bg-orange-600 text-white hover:bg-orange-700"
            : "gap-1.5"
        }
      >
        <Route className="h-4 w-4" />
        <span className="hidden sm:inline">흐름 편집</span>
      </Button>

      <Button
        variant={relationEditMode ? "default" : "ghost"}
        size="sm"
        onClick={toggleRelationEditMode}
        className={
          relationEditMode
            ? "gap-1.5 bg-[#800020] text-white hover:bg-[#990028]"
            : "gap-1.5"
        }
      >
        <Link className="h-4 w-4" />
        <span className="hidden sm:inline">관계 편집</span>
      </Button>
    </div>
  );
}
