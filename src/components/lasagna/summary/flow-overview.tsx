"use client";

import type { Simulation } from "@/types/lasagna";
import { FlowCanvas } from "../mindmap/flow-canvas";

export function FlowOverview({ simulation }: { simulation: Simulation }) {
  return (
    <div className="h-full">
      <FlowCanvas key={simulation.id} simulation={simulation} mode="readonly" />
    </div>
  );
}
