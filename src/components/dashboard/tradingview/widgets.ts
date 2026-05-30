const BASE = "https://s3.tradingview.com/external-embedding/embed-widget-";

export const TV_SCRIPTS = {
  tickerTape: `${BASE}ticker-tape.js`,
  stockHeatmap: `${BASE}stock-heatmap.js`,
  singleQuote: `${BASE}single-quote.js`,
  symbolOverview: `${BASE}symbol-overview.js`,
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
  isTransparent: true,
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
  isTransparent: true,
  width: "100%",
};

export const symbolOverviewConfig = {
  symbols: [
    ["테슬라", "NASDAQ:TSLA|1D"],
    ["엔비디아", "NASDAQ:NVDA|1D"],
    ["애플", "NASDAQ:AAPL|1D"],
    ["마이크로소프트", "NASDAQ:MSFT|1D"],
    ["구글", "NASDAQ:GOOGL|1D"],
    ["팔란티어", "NASDAQ:PLTR|1D"],
    ["브로드컴", "NASDAQ:AVGO|1D"],
    ["비자", "NYSE:V|1D"],
  ],
  chartOnly: false,
  chartType: "area",
  showVolume: false,
  showMA: false,
  isTransparent: true,
  width: "100%",
  height: "100%",
  dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
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
