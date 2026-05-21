import { useQuery } from "@tanstack/react-query";
import type {
  DashboardHistoryRange,
  DashboardHistoryResponse,
} from "@/app/api/dashboard-history/route";

const FALLBACK: DashboardHistoryResponse = {
  range: "3m",
  updatedAt: "",
  source: "error",
  series: [],
};

export function useDashboardHistory(range: DashboardHistoryRange) {
  return useQuery<DashboardHistoryResponse>({
    queryKey: ["dashboard-history", range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard-history?range=${range}`);
      if (!res.ok) return { ...FALLBACK, range };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: (previousData) =>
      previousData ?? { ...FALLBACK, range },
  });
}
