import { prisma } from "@/lib/prisma";

export interface GroupedLinkItem {
  id: string;
  title: string;
  author: string;
  url: string;
  description: string | null;
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
          sortOrder: true,
        },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    sortOrder: c.sortOrder,
    links: c.links,
  }));
}
