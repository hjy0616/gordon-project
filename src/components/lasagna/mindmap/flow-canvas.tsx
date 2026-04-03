"use client";

import { useCallback, useMemo, useRef } from "react";
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
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
  const rfInstance = useRef<ReactFlowInstance | null>(null);

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

  const handlePaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (mode === "readonly" || !rfInstance.current) return;

      const bounds = (
        event.currentTarget as HTMLElement
      ).getBoundingClientRect();
      const position = rfInstance.current.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const nodeType = mode === "liquidity" ? "liquidity" : "transmission";
      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label: "새 노드" },
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        persistNodes(updated);
        return updated;
      });
    },
    [mode, setNodes, persistNodes],
  );

  const isReadonly = mode === "readonly";

  return (
    <div className="relative h-full w-full">
      {!isReadonly && (
        <div className="absolute left-3 top-3 z-10 rounded-md border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          캔버스 더블클릭 → 노드 추가 · 노드 더블클릭 → 이름 수정 · Delete → 삭제
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isReadonly ? undefined : handleNodesChange}
        onEdgesChange={isReadonly ? undefined : handleEdgesChange}
        onConnect={isReadonly ? undefined : onConnect}
        onInit={(instance) => {
          rfInstance.current = instance;
        }}
        onDoubleClick={isReadonly ? undefined : handlePaneDoubleClick}
        nodeTypes={nodeTypes}
        deleteKeyCode={isReadonly ? null : ["Backspace", "Delete"]}
        fitView
        className="bg-background [&_.react-flow__controls]:border [&_.react-flow__controls]:bg-card [&_.react-flow__controls]:shadow-md [&_.react-flow__controls_button]:border-border [&_.react-flow__controls_button]:bg-card [&_.react-flow__controls_button]:fill-foreground [&_.react-flow__controls_button:hover]:bg-accent [&_.react-flow__minimap]:border [&_.react-flow__minimap]:bg-card [&_.react-flow__minimap]:shadow-md"
      >
        <Background />
        <Controls />
        <MiniMap
          zoomable
          pannable
          nodeColor={(node) => {
            if (node.type === "event") return "oklch(0.7 0.17 55)";
            if (node.type === "liquidity") return "#22c55e";
            return "oklch(0.5 0 0)";
          }}
          maskColor="oklch(0.15 0 0 / 70%)"
        />
      </ReactFlow>
    </div>
  );
}
