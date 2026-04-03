"use client";

import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData } from "@/types/lasagna";

export function EventNode({ data }: { data: FlowNodeData }) {
  return (
    <div className="rounded-lg border-2 border-primary bg-primary/10 px-4 py-2 shadow-md">
      <p className="text-sm font-bold text-primary">{data.label}</p>
      {data.description && (
        <p className="mt-0.5 text-xs text-primary/70">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
      <Handle type="target" position={Position.Top} className="!bg-primary" />
    </div>
  );
}
