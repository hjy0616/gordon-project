"use client";

import { STEP_CONFIG } from "@/types/lasagna";
import type { Simulation } from "@/types/lasagna";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { cn } from "@/lib/utils";

interface StepperNavProps {
  simulation: Simulation;
}

export function StepperNav({ simulation }: StepperNavProps) {
  const goToStep = useLasagnaStore((s) => s.goToStep);

  return (
    <div className="min-w-0 flex items-center gap-0 overflow-x-auto px-4 py-3">
      {STEP_CONFIG.map((step, idx) => {
        const isCompleted = simulation.steps[step.num]?.completed;
        const isCurrent = simulation.currentStep === step.num;
        const isAccessible = step.num <= simulation.currentStep;

        return (
          <div key={step.num} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  "h-px w-4 shrink-0 md:w-6",
                  isCompleted || isCurrent ? "bg-primary" : "bg-muted",
                )}
              />
            )}
            <button
              type="button"
              disabled={!isAccessible}
              onClick={() => {
                if (isAccessible) goToStep(simulation.id, step.num);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full transition-colors",
                isAccessible
                  ? "cursor-pointer"
                  : "cursor-default opacity-50",
              )}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary text-primary-foreground"
                      : "border border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {step.num}
              </div>
              <span className="hidden text-xs text-muted-foreground md:inline">
                {step.shortLabel}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
