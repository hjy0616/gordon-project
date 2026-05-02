"use client";

import { useEffect } from "react";

// Recharts 3.x ResponsiveContainer는 mount 직후 첫 frame에 calculatedWidth/Height=-1로 console.warn을 emit한다
// (LogUtils.js → console.warn). minWidth/minHeight props로 막히지 않는 cosmetic 이슈이며 차트 렌더링은 정상.
// console.error 와 console.warn 둘 다 patch 해야 하며 (Recharts는 warn만 사용), Next.js 16 dev 모드의
// [browser] forwarding 도 동일하게 차단된다.

const FILTERED_PATTERNS = [/The width\(-1\) and height\(-1\) of chart/];

function shouldFilter(args: unknown[]): boolean {
  const first = args[0];
  return (
    typeof first === "string" && FILTERED_PATTERNS.some((re) => re.test(first))
  );
}

export function RechartsWarningFilter() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args: unknown[]) => {
      if (shouldFilter(args)) return;
      originalError.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      if (shouldFilter(args)) return;
      originalWarn.apply(console, args);
    };
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
