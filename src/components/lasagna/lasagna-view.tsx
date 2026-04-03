"use client";

import { useState } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { SimulationPanel } from "./simulation-panel";
import { StepperNav } from "./stepper/stepper-nav";
import { StepContainer } from "./stepper/step-container";

export default function LasagnaView() {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const simulations = useLasagnaStore((s) => s.simulations);
  const selectedSimulationId = useLasagnaStore((s) => s.selectedSimulationId);
  const mainView = useLasagnaStore((s) => s.mainView);

  const simulation =
    simulations.find((s) => s.id === selectedSimulationId) ?? null;

  const mainContent = simulation ? (
    mainView === "stepper" ? (
      <div className="flex h-full flex-col">
        <StepperNav simulation={simulation} />
        <StepContainer simulation={simulation} />
      </div>
    ) : mainView === "mindmap" ? (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Mind Map (준비 중)</p>
      </div>
    ) : (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Summary (준비 중)</p>
      </div>
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
      <div className="relative -m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] overflow-hidden">
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
    <div className="relative -m-6 flex h-[calc(100svh-3rem)] w-[calc(100%+3rem)] overflow-hidden">
      {/* Side panel */}
      <div className="w-[30%] min-w-[280px] max-w-[400px] shrink-0 border-r">
        <SimulationPanel />
      </div>

      {/* Main content */}
      <div className="flex-1">{mainContent}</div>
    </div>
  );
}
