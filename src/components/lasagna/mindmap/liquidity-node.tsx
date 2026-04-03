"use client";

import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData } from "@/types/lasagna";

export function LiquidityNode({ data }: { data: FlowNodeData }) {
  return (
    <div className="rounded-lg border-2 border-green-500/50 bg-green-500/10 px-4 py-2 shadow-md">
      <p className="text-sm font-bold text-green-400">{data.label}</p>
      {data.description && (
        <p className="mt-0.5 text-xs text-green-400/70">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
    </div>
  );
}
