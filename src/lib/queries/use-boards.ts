import { useQuery } from "@tanstack/react-query";

export interface BoardSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface BoardsResponse {
  boards: BoardSummary[];
}

export function useBoards() {
  return useQuery<BoardsResponse>({
    queryKey: ["boards"],
    queryFn: async () => {
      const res = await fetch("/api/boards");
      if (!res.ok) {
        return { boards: [] };
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
