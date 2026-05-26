import { useQuery } from "@tanstack/react-query";

export interface LeaderboardTop3Entry {
  id: string;
  rank: 1 | 2 | 3;
}

export interface LeaderboardTop3Data {
  topThree: LeaderboardTop3Entry[];
  adminIds: string[];
}

const EMPTY: LeaderboardTop3Data = { topThree: [], adminIds: [] };

export function useLeaderboardTop3() {
  return useQuery<LeaderboardTop3Data>({
    queryKey: ["leaderboard-top3"],
    queryFn: async () => {
      const res = await fetch("/api/leaderboard/top3");
      if (!res.ok) {
        return EMPTY;
      }
      const data = (await res.json()) as Partial<LeaderboardTop3Data>;
      return {
        topThree: data.topThree ?? [],
        adminIds: data.adminIds ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
