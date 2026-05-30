"use client";

import type { ReactNode } from "react";
import { TradingViewWidget } from "@/components/dashboard/tradingview/tradingview-widget";
import {
  TV_SCRIPTS,
  tickerTapeConfig,
  stockHeatmapConfig,
  singleQuoteConfig,
  symbolOverviewConfig,
  advancedChartConfig,
  ADVANCED_SYMBOLS,
} from "@/components/dashboard/tradingview/widgets";

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 text-lg font-semibold">{children}</h2>;
}

export function MarketTab() {
  return (
    <div className="space-y-6">
      {/* Ticker Tape (풀폭) */}
      <TradingViewWidget
        scriptSrc={TV_SCRIPTS.tickerTape}
        config={tickerTapeConfig}
        height={78}
      />

      {/* 히트맵 (풀폭) */}
      <section>
        <SectionTitle>히트맵</SectionTitle>
        <TradingViewWidget
          scriptSrc={TV_SCRIPTS.stockHeatmap}
          config={stockHeatmapConfig}
          height={600}
        />
      </section>

      {/* 2열: 좌(환율 + 주요주식) / 우(지수·VIX 차트) — 모바일은 1열 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <section>
            <SectionTitle>환율</SectionTitle>
            <TradingViewWidget
              scriptSrc={TV_SCRIPTS.singleQuote}
              config={singleQuoteConfig}
              height={140}
            />
          </section>
          <section>
            <SectionTitle>미국 주요주식</SectionTitle>
            <TradingViewWidget
              scriptSrc={TV_SCRIPTS.symbolOverview}
              config={symbolOverviewConfig}
              height={600}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <SectionTitle>S&amp;P 500</SectionTitle>
            <TradingViewWidget
              scriptSrc={TV_SCRIPTS.advancedChart}
              config={advancedChartConfig(ADVANCED_SYMBOLS.sp500)}
              height={480}
            />
          </section>
          <section>
            <SectionTitle>나스닥</SectionTitle>
            <TradingViewWidget
              scriptSrc={TV_SCRIPTS.advancedChart}
              config={advancedChartConfig(ADVANCED_SYMBOLS.nasdaq)}
              height={480}
            />
          </section>
          <section>
            <SectionTitle>VIX 공포지수</SectionTitle>
            <TradingViewWidget
              scriptSrc={TV_SCRIPTS.advancedChart}
              config={advancedChartConfig(ADVANCED_SYMBOLS.vix)}
              height={480}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
