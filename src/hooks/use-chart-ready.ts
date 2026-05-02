"use client";

import { useCallback, useState } from "react";

// callback ref 패턴 — div가 늦게 mount되어도 (e.g. isLoading 분기로 Skeleton 후 swap) attach 시점에
// observer를 설치한다. useEffect+useRef는 mount 후 ref 변경을 감지 못해 ready가 영원히 false에 머물던 race를 회피.
export function useChartReady(): {
  ref: (node: HTMLDivElement | null) => void;
  ready: boolean;
} {
  const [ready, setReady] = useState(false);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const initial = node.getBoundingClientRect();
    if (initial.width > 0 && initial.height > 0) {
      setReady(true);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, ready };
}
