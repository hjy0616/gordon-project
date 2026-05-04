"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

/**
 * 엣지 endpoint를 잡고 드래그하는 동안 공유되는 visual state.
 * - 엣지(MindMapEdge)는 ghost preview를 그리기 위해
 * - 노드(MindMapNode)는 hover한 후보 노드에 reconnect halo를 띄우기 위해
 * 같은 정보를 읽는다. drag 중엔 setEdges를 호출하지 않고 이 state만 갱신해서
 * 원본 엣지를 보존 + drop 시 한 번에 적용한다.
 */
export type EndpointDragState = {
  edgeId: string;
  end: "source" | "target";
  cursorFlow: { x: number; y: number };
  hoverNodeId: string | null;
};

interface MindMapContextValue {
  readonly: boolean;
  sketchyMode: boolean;
  endpointDrag: EndpointDragState | null;
  setEndpointDrag: Dispatch<SetStateAction<EndpointDragState | null>>;
  /** NodeResizer 드래그 시작 — 매 프레임 자동저장 트리거를 게이팅. */
  beginResize: () => void;
  /** NodeResizer 드래그 종료 — 게이팅 해제 + 보류된 동기화 1회 flush. */
  endResize: () => void;
}

const MindMapContext = createContext<MindMapContextValue>({
  readonly: false,
  sketchyMode: false,
  endpointDrag: null,
  setEndpointDrag: () => {},
  beginResize: () => {},
  endResize: () => {},
});

export function MindMapProvider({
  readonly,
  sketchyMode,
  beginResize,
  endResize,
  children,
}: {
  readonly: boolean;
  sketchyMode: boolean;
  beginResize: () => void;
  endResize: () => void;
  children: ReactNode;
}) {
  const [endpointDrag, setEndpointDrag] = useState<EndpointDragState | null>(
    null,
  );
  const value = useMemo(
    () => ({
      readonly,
      sketchyMode,
      endpointDrag,
      setEndpointDrag,
      beginResize,
      endResize,
    }),
    [readonly, sketchyMode, endpointDrag, beginResize, endResize],
  );
  return (
    <MindMapContext.Provider value={value}>{children}</MindMapContext.Provider>
  );
}

export function useMindMapContext() {
  return useContext(MindMapContext);
}
