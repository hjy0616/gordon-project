"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeDirection } from "@/types/mind-map";

interface NodeQuickAddProps {
  visible: boolean;
}

// 각 방향 + 버튼은 진짜 xyflow <Handle>이라서 클릭+드래그 시 자동으로
// onConnectStart/End가 발화한다. 자식 노드 자동 생성 X — 사용자가 ghost
// edge를 끌고 가서 다른 노드 위에 드롭(=연결) 또는 빈 곳에 드롭(=자식 생성).
//
// 중요: !visible일 때 unmount하면 안 된다. 사용자가 +를 잡고 드래그하기
// 시작하면 마우스가 노드 밖으로 나가는데, 그 순간 hover 상태가 풀려
// unmount되면 xyflow connection drag의 pointerCapture가 끊긴다. 따라서
// 항상 mount하고 opacity/pointerEvents로만 토글한다.
const POSITIONS: Record<NodeDirection, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

export function NodeQuickAdd({ visible }: NodeQuickAddProps) {
  return (
    <>
      {(Object.keys(POSITIONS) as NodeDirection[]).map((dir) => (
        <Handle
          key={dir}
          id={`qa-${dir}`}
          type="source"
          position={POSITIONS[dir]}
          style={{
            width: 22,
            height: 22,
            background: "var(--primary)",
            border: "2px solid var(--background, white)",
            borderRadius: 9999,
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            zIndex: 25,
            color: "var(--primary-foreground, white)",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "crosshair",
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? "all" : "none",
            transition: "opacity 150ms ease",
          }}
        >
          <span style={{ pointerEvents: "none", userSelect: "none" }}>+</span>
        </Handle>
      ))}
    </>
  );
}
