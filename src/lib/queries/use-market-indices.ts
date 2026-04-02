import { useQuery } from "@tanstack/react-query";
import type { MarketIndex } from "@/app/api/market-indices/route";

interface MarketIndicesResponse {
  data: MarketIndex[];
  updatedAt: string;
  source: "yahoo" | "error";
}

const FALLBACK: MarketIndicesResponse = {
  data: [],
  updatedAt: "",
  source: "error",
};

export function useMarketIndices() {
  return useQuery<MarketIndicesResponse>({
    queryKey: ["market-indices"],
    queryFn: async () => {
      const res = await fetch("/api/market-indices");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: FALLBACK,
  });
}
