"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { EVENT_CATEGORIES, STEP_CONFIG } from "@/types/lasagna";
import type { Simulation } from "@/types/lasagna";
import { cn } from "@/lib/utils";

function ProgressBar({ simulation }: { simulation: Simulation }) {
  return (
    <div className="flex gap-0.5">
      {STEP_CONFIG.map((step) => {
        const stepData = simulation.steps[step.num];
        const isCurrent = simulation.currentStep === step.num;
        const isCompleted = stepData?.completed;
        return (
          <div
            key={step.num}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              isCompleted
                ? "bg-primary"
                : isCurrent
                  ? "bg-primary/50"
                  : "bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}

export function SimulationList() {
  const simulations = useLasagnaStore((s) => s.simulations);
  const selectedSimulationId = useLasagnaStore((s) => s.selectedSimulationId);
  const selectSimulation = useLasagnaStore((s) => s.selectSimulation);
  const deleteSimulation = useLasagnaStore((s) => s.deleteSimulation);
  const setMainView = useLasagnaStore((s) => s.setMainView);

  if (simulations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          시뮬레이션이 없습니다. 새로 만들어보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {simulations.map((sim) => {
        const eventLabel =
          EVENT_CATEGORIES.find((c) => c.value === sim.eventType)?.label ??
          sim.eventType;
        const isSelected = selectedSimulationId === sim.id;

        return (
          <div
            key={sim.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              selectSimulation(sim.id);
              setMainView("stepper");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectSimulation(sim.id);
                setMainView("stepper");
              }
            }}
            className={cn(
              "group relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{sim.title}</h3>
                <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {eventLabel}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSimulation(sim.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <ProgressBar simulation={sim} />
              <span className="shrink-0 text-xs text-muted-foreground">
                {sim.currentStep}/8
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
