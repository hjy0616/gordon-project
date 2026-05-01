import { useQuery } from "@tanstack/react-query";

export interface PostSummary {
  id: string;
  title: string;
  viewCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

interface BoardPostsResponse {
  posts: PostSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useBoardPosts(slug: string, page: number) {
  return useQuery<BoardPostsResponse>({
    queryKey: ["board-posts", slug, page],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${slug}/posts?page=${page}`);
      if (!res.ok) {
        return {
          posts: [],
          pagination: { page, limit: 20, total: 0, totalPages: 0 },
        };
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}
