import { useQuery } from "@tanstack/react-query";
import type { GroupedLinkCategory } from "@/lib/links/server";

interface LinksResponse {
  categories: GroupedLinkCategory[];
}

export function useLinks() {
  return useQuery<LinksResponse>({
    queryKey: ["links"],
    queryFn: async () => {
      const res = await fetch("/api/links");
      if (!res.ok) return { categories: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
