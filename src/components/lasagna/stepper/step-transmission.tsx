"use client";

import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";
import { FlowCanvas } from "../mindmap/flow-canvas";

interface StepTransmissionProps {
  simulation: Simulation;
}

export function StepTransmission({ simulation }: StepTransmissionProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[4] ?? {};

  return (
    <div className="flex flex-col gap-4">
      <div className="h-[380px] overflow-hidden rounded-md border md:h-[420px]">
        <FlowCanvas simulation={simulation} mode="transmission" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          전이 경로 메모
        </label>
        <Textarea
          value={stepData.transmissionNotes ?? ""}
          onChange={(e) =>
            updateStep(simulation.id, 4, {
              transmissionNotes: e.target.value,
            })
          }
          placeholder="이 충격이 어떤 경로로 번질 수 있는지 메모..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
