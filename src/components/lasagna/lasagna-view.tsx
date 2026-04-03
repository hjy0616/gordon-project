"use client";

import { useState } from "react";
import { List, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { SimulationPanel } from "./simulation-panel";
import { StepperNav } from "./stepper/stepper-nav";
import { StepContainer } from "./stepper/step-container";
import { SummaryView } from "./summary/summary-view";

export default function LasagnaView() {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const simulations = useLasagnaStore((s) => s.simulations);
  const selectedSimulationId = useLasagnaStore((s) => s.selectedSimulationId);
  const mainView = useLasagnaStore((s) => s.mainView);

  const simulation =
    simulations.find((s) => s.id === selectedSimulationId) ?? null;

  const mainContent = simulation ? (
    mainView === "stepper" ? (
      <div className="flex h-full min-w-0 flex-col">
        <StepperNav simulation={simulation} />
        <div className="min-h-0 flex-1 overflow-hidden">
          <StepContainer simulation={simulation} />
        </div>
      </div>
    ) : (
      <SummaryView simulation={simulation} />
    )
  ) : (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">
        시뮬레이션을 선택하거나 새로 만드세요
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="-m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] overflow-hidden">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-3 top-3 z-10"
          onClick={() => setSheetOpen(true)}
        >
          <List className="size-4" />
        </Button>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="left" className="w-[85vw] p-0">
            <SimulationPanel />
          </SheetContent>
        </Sheet>

        <div className="flex-1">{mainContent}</div>
      </div>
    );
  }

  return (
    <div className="-m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] overflow-hidden">
      {/* Side panel — collapsible */}
      <div
        className="shrink-0 overflow-hidden border-r transition-[width] duration-200"
        style={{
          width: panelCollapsed ? 0 : "min(30%, 400px)",
          borderRightWidth: panelCollapsed ? 0 : undefined,
        }}
      >
        <div className="h-full min-w-[280px] overflow-hidden">
          <SimulationPanel onCollapse={() => setPanelCollapsed(true)} />
        </div>
      </div>

      {/* Expand handle — thin strip on the left edge, only when collapsed */}
      {panelCollapsed && (
        <button
          type="button"
          onClick={() => setPanelCollapsed(false)}
          className="flex w-6 shrink-0 items-center justify-center border-r bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelLeftOpen className="size-3.5" />
        </button>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 overflow-hidden">{mainContent}</div>
    </div>
  );
}
