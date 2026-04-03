"use client";

import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { FlowNodeData } from "@/types/lasagna";
import { EditableLabel } from "./editable-label";

export function LiquidityNode({ id, data }: { id: string; data: FlowNodeData }) {
  const { setNodes } = useReactFlow();

  function handleLabelChange(label: string) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n,
      ),
    );
  }

  return (
    <div className="min-w-[80px] rounded-lg border-2 border-green-500/50 bg-green-500/10 px-4 py-2 shadow-md">
      <EditableLabel
        value={data.label}
        onChange={handleLabelChange}
        className="text-center text-sm font-bold text-green-400"
      />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
    </div>
  );
}
