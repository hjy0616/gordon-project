import { NextResponse } from "next/server";

const JUNK_BOND_ETFS = [
  { name: "HYG", symbol: "HYG" },
  { name: "JNK", symbol: "JNK" },
] as const;

export interface JunkBondEtf {
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
  item: (typeof JUNK_BOND_ETFS)[number],
): Promise<JunkBondEtf> {
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
  const data: JunkBondEtf[] = [];

  for (let i = 0; i < JUNK_BOND_ETFS.length; i++) {
    const result = await fetchSymbol(JUNK_BOND_ETFS[i]).catch(
      () =>
        ({
          name: JUNK_BOND_ETFS[i].name,
          symbol: JUNK_BOND_ETFS[i].symbol,
          price: null,
          changeRate: null,
        }) as JunkBondEtf,
    );
    data.push(result);

    if (i < JUNK_BOND_ETFS.length - 1) {
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
