import { useQuery } from "@tanstack/react-query";
import type { JunkBondEtf } from "@/app/api/junk-bond-etf/route";

interface JunkBondEtfResponse {
  data: JunkBondEtf[];
  updatedAt: string;
  source: "yahoo" | "error";
}

const FALLBACK: JunkBondEtfResponse = {
  data: [],
  updatedAt: "",
  source: "error",
};

export function useJunkBondEtf() {
  return useQuery<JunkBondEtfResponse>({
    queryKey: ["junk-bond-etf"],
    queryFn: async () => {
      const res = await fetch("/api/junk-bond-etf");
      if (!res.ok) return FALLBACK;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: FALLBACK,
  });
}
