import { useQuery } from "@tanstack/react-query";
import type { YahooIndicator } from "@/app/api/yahoo-indicators/route";

interface YahooIndicatorsResponse {
  data: YahooIndicator[];
  updatedAt: string;
  source: "yahoo" | "error";
}

const FALLBACK: YahooIndicatorsResponse = {
  data: [],
  updatedAt: "",
  source: "error",
};

export function useYahooIndicators() {
  return useQuery<YahooIndicatorsResponse>({
    queryKey: ["yahoo-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/yahoo-indicators");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: FALLBACK,
  });
}
