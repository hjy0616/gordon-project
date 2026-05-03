"use client";

import { Plus } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import {
  emptyMindMapNode,
  NODE_DRAG_HANDLE_SELECTOR,
  type MindMapFlowNode,
  type MindMapFlowEdge,
} from "@/types/mind-map";

export function AddNodeFab() {
  // addNodes를 써야 controlled 외부 state(useNodesState)에 반영되어 sync된다.
  const { addNodes, getViewport, getNodes } = useReactFlow<
    MindMapFlowNode,
    MindMapFlowEdge
  >();

  function handleAdd() {
    // 선택된 노드가 있으면 그 옆에, 없으면 화면 중앙에 추가.
    // 옆에 두면 사용자는 새 노드를 선택해 가장자리에서 끌어 기존 노드와 자연스럽게 연결.
    const selected = getNodes().find((n) => n.selected);
    let position: { x: number; y: number };
    if (selected) {
      position = {
        x: selected.position.x + (selected.measured?.width ?? 200) + 80,
        y: selected.position.y,
      };
    } else {
      const vp = getViewport();
      const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
      const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;
      position = { x: cx - 90, y: cy - 24 };
    }
    const stored = emptyMindMapNode(position);
    const node: MindMapFlowNode = {
      ...stored,
      type: "mindMap",
      dragHandle: NODE_DRAG_HANDLE_SELECTOR,
      selected: true,
    };
    addNodes(node);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label="새 노드 추가"
      title="새 노드 추가 (선택된 노드 옆에)"
      className="absolute bottom-4 right-4 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:size-10"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <Plus className="size-6 sm:size-5" aria-hidden />
    </button>
  );
}
