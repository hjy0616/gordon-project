const BASE = "https://s3.tradingview.com/external-embedding/embed-widget-";

export const TV_SCRIPTS = {
  tickerTape: `${BASE}ticker-tape.js`,
  stockHeatmap: `${BASE}stock-heatmap.js`,
  singleQuote: `${BASE}single-quote.js`,
  marketOverview: `${BASE}market-overview.js`,
  advancedChart: `${BASE}advanced-chart.js`,
} as const;

// ── 심볼 문자열은 Task 3에서 kr.tradingview.com 위젯 빌더로 확정/교정한다 ──

export const tickerTapeConfig = {
  symbols: [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
    { proName: "FX_IDC:EURUSD", title: "EUR/USD" },
    { proName: "FX_IDC:USDKRW", title: "USD/KRW" },
  ],
  showSymbolLogo: true,
  isTransparent: false,
  displayMode: "adaptive",
};

export const stockHeatmapConfig = {
  dataSource: "SPX500",
  blockSize: "market_cap_basic",
  blockColor: "change",
  grouping: "sector",
  hasTopBar: true,
  isDataSetEnabled: true,
  isZoomEnabled: true,
  hasSymbolTooltip: true,
  isMonoSize: false,
  width: "100%",
  height: "100%",
};

export const singleQuoteConfig = {
  symbol: "FX_IDC:USDKRW",
  isTransparent: false,
  width: "100%",
};

export const marketOverviewConfig = {
  dateRange: "12M",
  showChart: true,
  showSymbolLogo: true,
  showFloatingTooltip: false,
  isTransparent: false,
  width: "100%",
  height: "100%",
  tabs: [
    {
      title: "미국 주요주식",
      symbols: [
        { s: "NASDAQ:TSLA", d: "테슬라" },
        { s: "NASDAQ:NVDA", d: "엔비디아" },
        { s: "NASDAQ:AAPL", d: "애플" },
        { s: "NASDAQ:MSFT", d: "마이크로소프트" },
        { s: "NASDAQ:GOOGL", d: "구글" },
        { s: "NASDAQ:PLTR", d: "팔란티어" },
        { s: "NASDAQ:AVGO", d: "브로드컴" },
        { s: "NYSE:V", d: "비자" },
      ],
    },
  ],
};

export function advancedChartConfig(symbol: string) {
  return {
    symbol,
    interval: "D",
    timezone: "Asia/Seoul",
    style: "1",
    autosize: true,
    allow_symbol_change: true,
    hide_top_toolbar: false,
    withdateranges: true,
  };
}

export const ADVANCED_SYMBOLS = {
  sp500: "FOREXCOM:SPX500",
  nasdaq: "FOREXCOM:NSXUSD",
  vix: "CAPITALCOM:VIX",
} as const;
