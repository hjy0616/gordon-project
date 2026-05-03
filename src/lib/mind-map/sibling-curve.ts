import type { MindMapEdgeStyle, MindMapFlowEdge } from "@/types/mind-map";

/**
 * 같은 노드 쌍 사이에 여러 엣지가 있으면 자동 perpendicular offset을 적용해 겹침 방지.
 * 사용자가 직접 지정한 자유 곡선(style.curve)은 보존.
 *
 * 새 엣지 생성 시 + 엣지 reconnect 시 둘 다 호출해야 함.
 */
export function applySiblingCurveOffset(
  edges: MindMapFlowEdge[],
): MindMapFlowEdge[] {
  const counts = new Map<string, number>();
  return edges.map((e) => {
    const key = [e.source, e.target].sort().join("|");
    const idx = counts.get(key) ?? 0;
    counts.set(key, idx + 1);
    if (idx === 0) return e;
    const prevStyle =
      (e.data?.style as MindMapEdgeStyle | undefined) ?? undefined;
    if (prevStyle?.curve) return e;
    const sign = idx % 2 === 1 ? 1 : -1;
    const magnitude = Math.ceil(idx / 2) * 60;
    const dx = 0;
    const dy = magnitude * sign;
    return {
      ...e,
      data: {
        ...(e.data ?? {}),
        style: { ...(prevStyle ?? {}), curve: { dx, dy } },
      },
    };
  });
}
