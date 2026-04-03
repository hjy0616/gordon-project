"use client";

import { Handle, Position } from "@xyflow/react";
import type { FlowNodeData } from "@/types/lasagna";

export function TransmissionNode({ data }: { data: FlowNodeData }) {
  return (
    <div className="rounded-lg border-2 border-border bg-card px-4 py-2 shadow-md">
      <p className="text-sm font-bold text-foreground">{data.label}</p>
      {data.description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{data.description}</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
    </div>
  );
}
