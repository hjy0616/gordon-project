"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type TradingViewWidgetProps = {
  /** 예: https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js */
  scriptSrc: string;
  /** 위젯별 설정 객체 (colorTheme/theme/locale은 내부에서 주입) */
  config: Record<string, unknown>;
  /** 컨테이너 고정 높이(px). 위젯은 이 높이를 채운다. */
  height?: number;
  className?: string;
};

export function TradingViewWidget({
  scriptSrc,
  config,
  height = 400,
  className,
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const colorTheme = resolvedTheme === "light" ? "light" : "dark";

  // 직렬화 문자열을 effect 의존성으로 사용 → 내용이 바뀔 때만 재실행(리빌드 루프 방지).
  // width/height를 명시적으로 주입(픽셀) → "100%" CSS 비율을 안 먹는 위젯(Market Overview 등)도
  // 컨테이너 높이를 그대로 따른다. autosize 차트는 이 값을 무시하므로 영향 없음.
  const payload = JSON.stringify({
    ...config,
    width: "100%",
    height,
    colorTheme,
    theme: colorTheme,
    locale: "kr",
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 이전 위젯 제거(테마/설정 변경 재실행 + dev StrictMode 이중 실행 대비)
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.type = "text/javascript";
    script.innerHTML = payload;
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [scriptSrc, payload]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height }}
      />
      {/* 무료 위젯 ToS: TradingView 출처 표기 */}
      <div className="tradingview-widget-copyright pt-1 text-right text-[11px] text-muted-foreground/60">
        <a href="https://kr.tradingview.com/" rel="noopener nofollow" target="_blank">
          TradingView 제공
        </a>
      </div>
    </div>
  );
}
