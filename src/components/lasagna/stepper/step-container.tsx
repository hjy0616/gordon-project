"use client";

import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { STEP_CONFIG, STEP_PROMPTS } from "@/types/lasagna";
import type { Simulation } from "@/types/lasagna";
import React from "react";
import { StepDomain } from "./step-domain";
import { StepCause } from "./step-cause";
import { StepAmplifier } from "./step-amplifier";
import { StepTransmission } from "./step-transmission";
import { StepCondition } from "./step-condition";
import { StepLiquidity } from "./step-liquidity";
import { StepReversibility } from "./step-reversibility";
import { StepAction } from "./step-action";

const STEP_COMPONENTS: Record<
  number,
  React.ComponentType<{ simulation: Simulation }>
> = {
  1: StepDomain,
  2: StepCause,
  3: StepAmplifier,
  4: StepTransmission,
  5: StepCondition,
  6: StepLiquidity,
  7: StepReversibility,
  8: StepAction,
};

interface StepContainerProps {
  simulation: Simulation;
}

export function StepContainer({ simulation }: StepContainerProps) {
  const advanceStep = useLasagnaStore((s) => s.advanceStep);
  const goToStep = useLasagnaStore((s) => s.goToStep);
  const completeSimulation = useLasagnaStore((s) => s.completeSimulation);

  const step = simulation.currentStep;
  const stepInfo = STEP_CONFIG.find((s) => s.num === step);
  const prompt = STEP_PROMPTS[step];
  const StepComponent = STEP_COMPONENTS[step];

  const isFirstStep = step === 1;
  const isLastStep = step === 8;

  function handlePrev() {
    if (!isFirstStep) {
      goToStep(simulation.id, step - 1);
    }
  }

  function handleNext() {
    if (isLastStep) {
      advanceStep(simulation.id);
      completeSimulation(simulation.id);
    } else {
      advanceStep(simulation.id);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Prompt box */}
      <div className="mx-4 mt-4 rounded-md border-l-[3px] border-primary bg-primary/5 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">
          Step {step}: {stepInfo?.label}
        </p>
        <p className="mt-1 text-sm">{prompt}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 p-4">
        {StepComponent ? (
          <StepComponent simulation={simulation} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Step {step}: {stepInfo?.label ?? `Step ${step}`}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={isFirstStep}
          onClick={handlePrev}
        >
          <ChevronLeft className="mr-1 size-4" />
          이전
        </Button>
        <Button size="sm" onClick={handleNext}>
          {isLastStep ? (
            <>
              <Check className="mr-1 size-4" />
              완료
            </>
          ) : (
            <>
              다음
              <ChevronRight className="ml-1 size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
