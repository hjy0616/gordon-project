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

export interface GroupedLinkCategory {
  id: string;
  name: string;
  sortOrder: number;
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

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    links: c.links.map((l) => ({
      id: l.id,
      title: l.title,
      author: l.author,
      url: l.url,
      description: l.description,
      episodes: parseEpisodes(l.episodes),
      sortOrder: l.sortOrder,
    })),
  }));
}
