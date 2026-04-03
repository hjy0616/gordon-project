"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation, SimFlowNode, SimFlowEdge } from "@/types/lasagna";
import { EventNode } from "./event-node";
import { TransmissionNode } from "./transmission-node";
import { LiquidityNode } from "./liquidity-node";

const nodeTypes = {
  event: EventNode,
  transmission: TransmissionNode,
  liquidity: LiquidityNode,
};

function toFlowNodes(simNodes: SimFlowNode[]): Node[] {
  return simNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { ...n.data } as Record<string, unknown>,
  }));
}

function toFlowEdges(simEdges: SimFlowEdge[]): Edge[] {
  return simEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    label: e.label,
    style: e.style,
  }));
}

function toSimNodes(flowNodes: Node[]): SimFlowNode[] {
  return flowNodes.map((n) => ({
    id: n.id,
    type: (n.type ?? "transmission") as SimFlowNode["type"],
    position: n.position,
    data: {
      label: (n.data as { label?: string }).label ?? "",
      description: (n.data as { description?: string }).description,
    },
  }));
}

function toSimEdges(flowEdges: Edge[]): SimFlowEdge[] {
  return flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
    label: typeof e.label === "string" ? e.label : undefined,
    style: e.style as SimFlowEdge["style"],
  }));
}

interface FlowCanvasProps {
  simulation: Simulation;
  mode: "transmission" | "liquidity" | "readonly";
}

export function FlowCanvas({ simulation, mode }: FlowCanvasProps) {
  const updateFlowNodes = useLasagnaStore((s) => s.updateFlowNodes);
  const updateFlowEdges = useLasagnaStore((s) => s.updateFlowEdges);

  const initialNodes = useMemo(
    () => toFlowNodes(simulation.flowNodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simulation.id],
  );
  const initialEdges = useMemo(
    () => toFlowEdges(simulation.flowEdges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [simulation.id],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [newLabel, setNewLabel] = useState("");
  const rafRef = useRef<number | null>(null);

  const persistNodes = useCallback(
    (updated: Node[]) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateFlowNodes(simulation.id, toSimNodes(updated));
      });
    },
    [simulation.id, updateFlowNodes],
  );

  const persistEdges = useCallback(
    (updated: Edge[]) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateFlowEdges(simulation.id, toSimEdges(updated));
      });
    },
    [simulation.id, updateFlowEdges],
  );

  const handleNodesChange: typeof onNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      setNodes((current) => {
        persistNodes(current);
        return current;
      });
    },
    [onNodesChange, setNodes, persistNodes],
  );

  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setEdges((current) => {
        persistEdges(current);
        return current;
      });
    },
    [onEdgesChange, setEdges, persistEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeStyle =
        mode === "liquidity"
          ? { stroke: "#22c55e", strokeWidth: 2 }
          : undefined;
      setEdges((eds) => {
        const updated = addEdge({ ...connection, style: edgeStyle }, eds);
        persistEdges(updated);
        return updated;
      });
    },
    [mode, setEdges, persistEdges],
  );

  const handleAddNode = useCallback(() => {
    const label = newLabel.trim();
    if (!label) return;

    const nodeType = mode === "liquidity" ? "liquidity" : "transmission";
    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: {
        x: 200 + Math.random() * 200,
        y: 150 + nodes.length * 80,
      },
      data: { label },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      persistNodes(updated);
      return updated;
    });
    setNewLabel("");
  }, [newLabel, mode, nodes.length, setNodes, persistNodes]);

  const isReadonly = mode === "readonly";

  return (
    <div className="flex flex-col gap-2">
      {!isReadonly && (
        <div className="flex items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNode();
            }}
            placeholder={
              mode === "liquidity"
                ? "유동성 노드 이름..."
                : "전이 경로 노드 이름..."
            }
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddNode}
            disabled={!newLabel.trim()}
            className="h-8 shrink-0"
          >
            <Plus className="mr-1 size-3.5" />
            추가
          </Button>
        </div>
      )}

      <div className="h-[400px] md:h-[450px] rounded-md border bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isReadonly ? undefined : handleNodesChange}
          onEdgesChange={isReadonly ? undefined : handleEdgesChange}
          onConnect={isReadonly ? undefined : onConnect}
          nodeTypes={nodeTypes}
          deleteKeyCode={isReadonly ? null : "Backspace"}
          fitView
          className="bg-background"
        >
          <Background />
          <Controls />
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </div>
  );
}
