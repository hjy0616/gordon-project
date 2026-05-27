"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLinks } from "@/lib/queries/use-links";
import { LinkCard } from "./link-card";
import { LinkCategoryChip } from "./link-category-chip";
import type { GroupedLinkCategory, GroupedLinkItem } from "@/lib/links/server";

const ALL = "__all__";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function matchesQuery(link: GroupedLinkItem, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    link.title.toLowerCase().includes(needle) ||
    link.author.toLowerCase().includes(needle) ||
    hostnameOf(link.url).includes(needle)
  );
}

export function LinksClient() {
  const { data, isLoading } = useLinks();
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const categories: GroupedLinkCategory[] = data?.categories ?? [];

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.links.length > 0),
    [categories],
  );

  const totalCount = useMemo(
    () => visibleCategories.reduce((sum, c) => sum + c.links.length, 0),
    [visibleCategories],
  );

  const renderedGroups = useMemo(() => {
    const trimmed = query.trim();
    return visibleCategories.flatMap<{
      id: string;
      name: string;
      links: GroupedLinkItem[];
    }>((c) => {
      if (activeCategory !== ALL && c.id !== activeCategory) return [];
      const links = c.links.filter((l) => matchesQuery(l, trimmed));
      if (links.length === 0) return [];
      return [{ id: c.id, name: c.name, links }];
    });
  }, [visibleCategories, activeCategory, query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Links</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          망고단 링크 정보 모음
        </p>
      </header>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목·작성자·도메인으로 검색"
            className="pl-9"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <LinkCategoryChip
            label="전체"
            count={totalCount}
            active={activeCategory === ALL}
            onClick={() => setActiveCategory(ALL)}
          />
          {visibleCategories.map((c) => (
            <LinkCategoryChip
              key={c.id}
              label={c.name}
              count={c.links.length}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : renderedGroups.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {query.trim() ? "검색 결과가 없습니다." : "등록된 링크가 없습니다."}
        </div>
      ) : (
        <div className="space-y-8">
          {renderedGroups.map((group) => (
            <section key={group.id}>
              <header className="sticky top-0 z-10 mb-3 -mx-4 flex items-baseline gap-2 bg-background/80 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <h2 className="text-lg font-semibold text-foreground">
                  {group.name}
                </h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {group.links.length}
                </span>
              </header>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.links.map((link) => (
                  <LinkCard
                    key={link.id}
                    title={link.title}
                    author={link.author}
                    url={link.url}
                    description={link.description}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
