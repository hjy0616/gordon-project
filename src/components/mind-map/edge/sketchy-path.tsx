"use client";

import { useEffect, useRef } from "react";
import rough from "roughjs/bin/rough";

interface SketchyPathProps {
  d: string;
  stroke: string;
  strokeWidth: number;
  /** 0–3, 기본 1.5. 너무 크면 라인이 알아볼 수 없을 만큼 흔들림. */
  roughness?: number;
}

/**
 * 주어진 SVG path d를 rough.js로 다시 그려 손그림 효과를 낸다.
 * RoughSVG는 ownerSVGElement가 마운트된 후에만 작동하므로 effect로 처리.
 */
export function SketchyPath({
  d,
  stroke,
  strokeWidth,
  roughness = 1.4,
}: SketchyPathProps) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    const svg = g.ownerSVGElement;
    if (!svg) return;
    const rs = rough.svg(svg);
    const node = rs.path(d, {
      stroke,
      strokeWidth,
      roughness,
      bowing: 1,
      // 색칠 X — 라인 only
      fill: undefined,
      // 라인 disableMultiStroke=false면 살짝 두 번 그어서 손그림 느낌 강화
      disableMultiStroke: false,
    });
    g.replaceChildren(node);
    return () => {
      g.replaceChildren();
    };
  }, [d, stroke, strokeWidth, roughness]);

  return <g ref={ref} />;
}
