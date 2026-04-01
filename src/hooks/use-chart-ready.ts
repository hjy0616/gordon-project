"use client";

import { useRef, useState, useEffect, type RefObject } from "react";

/**
 * ResponsiveContainer가 -1 치수를 측정하는 문제를 방지하기 위해
 * 컨테이너가 양수 크기를 가질 때까지 차트 렌더링을 지연시키는 hook.
 */
export function useChartReady(): {
  ref: RefObject<HTMLDivElement | null>;
  ready: boolean;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setReady(width > 0 && height > 0);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, ready };
}
