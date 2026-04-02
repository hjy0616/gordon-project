import { NextResponse } from "next/server";

const MARKET_ITEMS = [
  { name: "달러인덱스", symbol: "DX-Y.NYB" },
  { name: "비트코인", symbol: "BTC-USD" },
  { name: "원/달러", symbol: "KRW=X" },
  { name: "이더리움", symbol: "ETH-USD" },
  { name: "금 (Gold)", symbol: "GC=F" },
  { name: "WTI유", symbol: "CL=F" },
  { name: "은 (Silver)", symbol: "SI=F" },
  { name: "천연가스", symbol: "NG=F" },
] as const;

export interface MarketIndex {
  name: string;
  symbol: string;
  price: number | null;
  changeRate: number | null;
}

// 원본 Scriptable 위젯과 동일한 방식: v8 chart API, 순차 요청
// Scriptable은 for 루프에서 await로 하나씩 호출 → 자연스러운 딜레이
// 서버에서는 명시적 딜레이 필요 (Yahoo rate limit 회피)

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        chartPreviousClose: number;
        previousClose?: number;
      };
      indicators: { quote: Array<{ close: (number | null)[] }> };
    }> | null;
  };
}

async function fetchSymbol(
  item: (typeof MARKET_ITEMS)[number],
): Promise<MarketIndex> {
  const encoded = encodeURIComponent(item.symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2d`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) {
    return { name: item.name, symbol: item.symbol, price: null, changeRate: null };
  }

  const json: YahooChartResponse = await res.json().catch(() => null);
  const result = json?.chart?.result?.[0];

  if (!result) {
    return { name: item.name, symbol: item.symbol, price: null, changeRate: null };
  }

  const currentPrice = result.meta.regularMarketPrice;

  // 원본 위젯 로직과 동일: 차트 배열에서 전일 종가 추출
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const prevClose = closes.length > 1
    ? (closes[0] ?? result.meta.chartPreviousClose)
    : (result.meta.previousClose ?? result.meta.chartPreviousClose);

  const changeRate = prevClose && prevClose !== 0
    ? Number(((currentPrice - prevClose) / prevClose * 100).toFixed(2))
    : null;

  return { name: item.name, symbol: item.symbol, price: currentPrice, changeRate };
}

export async function GET() {
  const data: MarketIndex[] = [];

  for (let i = 0; i < MARKET_ITEMS.length; i++) {
    const result = await fetchSymbol(MARKET_ITEMS[i]).catch(
      () => ({ name: MARKET_ITEMS[i].name, symbol: MARKET_ITEMS[i].symbol, price: null, changeRate: null }) as MarketIndex,
    );
    data.push(result);

    // 마지막 요청 후에는 딜레이 불필요
    if (i < MARKET_ITEMS.length - 1) {
      await delay(1500);
    }
  }

  const hasAnyData = data.some((d) => d.price !== null);

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: hasAnyData ? "yahoo" : "error" },
    {
      headers: {
        "Cache-Control": hasAnyData
          ? "s-maxage=300, stale-while-revalidate=60"
          : "s-maxage=60, stale-while-revalidate=30",
      },
    },
  );
}
