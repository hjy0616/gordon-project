import { NextResponse } from "next/server";

const YAHOO_INDICATORS = [
  { name: "VIX", symbol: "^VIX" },
  { name: "US 2Y", symbol: "2YY=F" },
  { name: "US 10Y", symbol: "^TNX" },
] as const;

export interface YahooIndicator {
  name: string;
  symbol: string;
  price: number | null;
  changeRate: number | null;
}

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
  item: (typeof YAHOO_INDICATORS)[number],
): Promise<YahooIndicator> {
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

  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const prevClose =
    closes.length > 1
      ? (closes[0] ?? result.meta.chartPreviousClose)
      : (result.meta.previousClose ?? result.meta.chartPreviousClose);

  const changeRate =
    prevClose && prevClose !== 0
      ? Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2))
      : null;

  return { name: item.name, symbol: item.symbol, price: currentPrice, changeRate };
}

export async function GET() {
  const data: YahooIndicator[] = [];

  for (let i = 0; i < YAHOO_INDICATORS.length; i++) {
    const result = await fetchSymbol(YAHOO_INDICATORS[i]).catch(
      () =>
        ({
          name: YAHOO_INDICATORS[i].name,
          symbol: YAHOO_INDICATORS[i].symbol,
          price: null,
          changeRate: null,
        }) as YahooIndicator,
    );
    data.push(result);

    if (i < YAHOO_INDICATORS.length - 1) {
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
