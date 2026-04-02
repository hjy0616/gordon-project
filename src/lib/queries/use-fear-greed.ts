import { useQuery } from "@tanstack/react-query";
import type { FearGreedData } from "@/app/api/fear-greed/route";

interface FearGreedResponse {
  data: FearGreedData[];
  updatedAt: string;
  source: "cnn" | "error";
}

const FALLBACK: FearGreedResponse = {
  data: [],
  updatedAt: new Date().toISOString(),
  source: "error",
};

export function useFearGreedIndex() {
  return useQuery<FearGreedResponse>({
    queryKey: ["fear-greed"],
    queryFn: async () => {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK,
  });
}
