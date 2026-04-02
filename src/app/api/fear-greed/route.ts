import { NextResponse } from "next/server";

interface CnnDataPoint {
  x: number;
  y: number;
  rating: string;
}

interface CnnApiResponse {
  fear_and_greed_historical: {
    data: CnnDataPoint[];
  };
}

export interface FearGreedData {
  score: number;
  rating: string;
  timestamp: number;
}

export async function GET() {
  const url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";

  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer: "https://edition.cnn.com/markets/fear-and-greed",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { data: [], updatedAt: new Date().toISOString(), source: "error" },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } },
    );
  }

  const json: CnnApiResponse = await res.json();
  const raw = json.fear_and_greed_historical?.data ?? [];
  const recent = raw.slice(-90);

  const data: FearGreedData[] = recent.map((d) => ({
    score: Math.round(d.y),
    rating: d.rating,
    timestamp: d.x,
  }));

  return NextResponse.json(
    { data, updatedAt: new Date().toISOString(), source: "cnn" },
    { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" } },
  );
}
