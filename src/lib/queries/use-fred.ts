import { useQuery } from "@tanstack/react-query";
import type { FredIndicator } from "@/app/api/fred/route";

interface FredResponse {
  data: FredIndicator[];
  updatedAt: string;
  source: "fred" | "error";
}

const FALLBACK: FredResponse = {
  data: [],
  updatedAt: "",
  source: "error",
};

export function useFredIndicators() {
  return useQuery<FredResponse>({
    queryKey: ["fred-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/fred");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    placeholderData: FALLBACK,
  });
}
