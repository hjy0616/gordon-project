import type { NodeShape } from "@/types/mind-map";

/**
 * 도형의 boundary와 두 노드 중심을 잇는 직선의 교점을 계산하는 순수 함수 모음.
 *
 * 사용처: floating edge 컴포넌트가 두 노드의 측정된 위치/크기를 받아
 * 라인을 노드 어느 변에서 시작/도착시킬지 결정한다. 핸들 ID에 의존하지 않으므로
 * 레거시 데이터(sourceHandle="top" 등)도 그대로 자연스럽게 그려진다.
 */
export interface NodeBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
  shape: NodeShape;
}

interface Point {
  x: number;
  y: number;
}

/**
 * source의 boundary에서 target 중심 방향으로 나가는 교점.
 * 두 노드 중심이 정확히 같으면(드래그 중 일시적으로 발생) 중심을 반환 — path가
 * 0길이가 되어도 NaN으로 깨지진 않는다.
 */
export function getBoundaryIntersection(
  source: NodeBox,
  target: NodeBox,
): Point {
  const dx = target.cx - source.cx;
  const dy = target.cy - source.cy;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return { x: source.cx, y: source.cy };
  }

  if (source.shape === "ellipse") {
    return ellipseIntersection(source.cx, source.cy, source.w, source.h, dx, dy);
  }

  const polygon = getPolygon(source);
  const hit = rayPolygonHit(source.cx, source.cy, dx, dy, polygon);
  return hit ?? { x: source.cx, y: source.cy };
}

/**
 * 노드 중심에서 주어진 각도(라디안) 방향으로 ray를 쏘아 boundary와 만나는 점.
 * 사용자가 endpoint를 직접 지정한 경우 사용 (edge.style.sourceAnchor / targetAnchor).
 * 도형 변경/리사이즈에도 같은 angle은 의미가 유지되어 boundary에 자연 매핑.
 */
export function getBoundaryFromAngle(box: NodeBox, angle: number): Point {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  if (box.shape === "ellipse") {
    return ellipseIntersection(box.cx, box.cy, box.w, box.h, dx, dy);
  }
  const polygon = getPolygon(box);
  const hit = rayPolygonHit(box.cx, box.cy, dx, dy, polygon);
  return hit ?? { x: box.cx, y: box.cy };
}

function ellipseIntersection(
  cx: number,
  cy: number,
  w: number,
  h: number,
  dx: number,
  dy: number,
): Point {
  const a = w / 2;
  const b = h / 2;
  // 직선 (cx + t·dx, cy + t·dy)을 (x-cx)²/a² + (y-cy)²/b² = 1 에 대입.
  // (t·dx/a)² + (t·dy/b)² = 1  →  t = 1 / sqrt((dx/a)² + (dy/b)²)
  const denom = (dx * dx) / (a * a) + (dy * dy) / (b * b);
  if (denom <= 0) return { x: cx, y: cy };
  const t = 1 / Math.sqrt(denom);
  return { x: cx + t * dx, y: cy + t * dy };
}

function getPolygon(box: NodeBox): Array<[number, number]> {
  const { cx, cy, w, h, shape } = box;
  const hw = w / 2;
  const hh = h / 2;
  switch (shape) {
    case "diamond":
      return [
        [cx, cy - hh],
        [cx + hw, cy],
        [cx, cy + hh],
        [cx - hw, cy],
      ];
    case "hexagon": {
      const qw = w * 0.25;
      return [
        [cx - qw, cy - hh],
        [cx + qw, cy - hh],
        [cx + hw, cy],
        [cx + qw, cy + hh],
        [cx - qw, cy + hh],
        [cx - hw, cy],
      ];
    }
    // rectangle, rounded, sticky 모두 사각형 boundary.
    // (rounded의 corner radius는 무시 — bezier 가까이서 살짝 들어가도 라인이 보기 흉하진 않다.)
    default:
      return [
        [cx - hw, cy - hh],
        [cx + hw, cy - hh],
        [cx + hw, cy + hh],
        [cx - hw, cy + hh],
      ];
  }
}

/**
 * 중심에서 외부 방향 ray와 다각형 변(segment)의 가장 가까운 양의 t 교점을 찾는다.
 * det ≈ 0이면 평행 → 스킵. s ∈ [0, 1]만 유효한 교점.
 */
function rayPolygonHit(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  poly: Array<[number, number]>,
): Point | null {
  let bestT = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ax = a[0];
    const ay = a[1];
    const bx = b[0];
    const by = b[1];
    const sx = bx - ax;
    const sy = by - ay;

    // ray (cx,cy)+t(dx,dy) == segment (ax,ay)+s(sx,sy)
    //  dx·t - sx·s = ax - cx
    //  dy·t - sy·s = ay - cy
    const det = -dx * sy + dy * sx;
    if (Math.abs(det) < 1e-9) continue;
    const t = (-(ax - cx) * sy + (ay - cy) * sx) / det;
    const s = (dx * (ay - cy) - dy * (ax - cx)) / det;
    if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9 && t < bestT) bestT = t;
  }
  if (!Number.isFinite(bestT)) return null;
  return { x: cx + bestT * dx, y: cy + bestT * dy };
}
