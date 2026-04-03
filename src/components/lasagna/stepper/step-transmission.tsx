"use client";

import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";
import { FlowCanvas } from "../mindmap/flow-canvas";

interface StepTransmissionProps {
  simulation: Simulation;
}

export function StepTransmission({ simulation }: StepTransmissionProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const updateFlowNodes = useLasagnaStore((s) => s.updateFlowNodes);

  const stepData = simulation.steps[4] ?? {};

  useEffect(() => {
    if (simulation.flowNodes.length === 0) {
      updateFlowNodes(simulation.id, [
        {
          id: "event-root",
          type: "event",
          position: { x: 250, y: 50 },
          data: { label: simulation.title },
        },
      ]);
    }
  }, [simulation.id, simulation.flowNodes.length, simulation.title, updateFlowNodes]);

  return (
    <div className="flex flex-col gap-4">
      <FlowCanvas simulation={simulation} mode="transmission" />

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
