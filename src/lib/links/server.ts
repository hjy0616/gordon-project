import { prisma } from "@/lib/prisma";
import { parseEpisodes, type LinkEpisode } from "@/lib/links/types";

export interface GroupedLinkItem {
  id: string;
  title: string;
  author: string | null;
  url: string;
  description: string | null;
  episodes: LinkEpisode[] | null;
  sortOrder: number;
}

export type LinkGroup = "mango" | "nefcon";

export interface GroupedLinkCategory {
  id: string;
  name: string;
  sortOrder: number;
  group: LinkGroup;
  links: GroupedLinkItem[];
}

export async function getGroupedLinks(): Promise<GroupedLinkCategory[]> {
  const categories = await prisma.linkCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      links: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          author: true,
          url: true,
          description: true,
          episodes: true,
          sortOrder: true,
        },
      },
    },
  });

  return categories.map((c) => {
    const links = c.links.map((l) => ({
      id: l.id,
      title: l.title,
      author: l.author,
      url: l.url,
      description: l.description,
      episodes: parseEpisodes(l.episodes),
      sortOrder: l.sortOrder,
    }));
    // 그룹은 저장하지 않고 도출: 회차(episodes)를 가진 링크가 있으면 네프콘, 아니면 망고단.
    // (author는 옵셔널이라 신호로 부적합 — episodes 유무가 네프콘의 정의)
    const group: LinkGroup = links.some(
      (l) => l.episodes && l.episodes.length > 0,
    )
      ? "nefcon"
      : "mango";
    return { id: c.id, name: c.name, sortOrder: c.sortOrder, group, links };
  });
}
