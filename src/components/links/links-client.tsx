"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLinks } from "@/lib/queries/use-links";
import { LinkCard } from "./link-card";
import { LinkCategoryChip } from "./link-category-chip";
import type {
  GroupedLinkCategory,
  GroupedLinkItem,
  LinkGroup,
} from "@/lib/links/server";

const ALL = "__all__";

const GROUP_LABEL: Record<LinkGroup, string> = {
  mango: "🥭 망고단",
  nefcon: "💵 네프콘",
};

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
  const haystack = [
    link.title,
    link.author ?? "",
    hostnameOf(link.url),
    ...(link.episodes
      ? ["네프콘", ...link.episodes.map((e) => `${e.no} ${e.title}`)]
      : []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function LinksClient() {
  const { data, isLoading } = useLinks();
  const [activeGroup, setActiveGroup] = useState<LinkGroup>("mango");
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [query, setQuery] = useState("");

  const categories = useMemo<GroupedLinkCategory[]>(
    () => data?.categories ?? [],
    [data],
  );

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.links.length > 0),
    [categories],
  );

  const groupCounts = useMemo(() => {
    let mango = 0;
    let nefcon = 0;
    for (const c of visibleCategories) {
      if (c.group === "nefcon") nefcon += c.links.length;
      else mango += c.links.length;
    }
    return { mango, nefcon };
  }, [visibleCategories]);

  const groupCategories = useMemo(
    () => visibleCategories.filter((c) => c.group === activeGroup),
    [visibleCategories, activeGroup],
  );

  const totalCount = useMemo(
    () => groupCategories.reduce((sum, c) => sum + c.links.length, 0),
    [groupCategories],
  );

  const renderedGroups = useMemo(() => {
    const trimmed = query.trim();
    return groupCategories.flatMap<{
      id: string;
      name: string;
      links: GroupedLinkItem[];
    }>((c) => {
      if (activeCategory !== ALL && c.id !== activeCategory) return [];
      const links = c.links.filter((l) => matchesQuery(l, trimmed));
      if (links.length === 0) return [];
      return [{ id: c.id, name: c.name, links }];
    });
  }, [groupCategories, activeCategory, query]);

  // 현재 영역엔 검색 결과가 없지만 다른 영역엔 있는 경우의 안내용 카운트
  const otherGroup: LinkGroup = activeGroup === "mango" ? "nefcon" : "mango";
  const otherGroupMatches = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return 0;
    return visibleCategories
      .filter((c) => c.group === otherGroup)
      .reduce(
        (sum, c) =>
          sum + c.links.filter((l) => matchesQuery(l, trimmed)).length,
        0,
      );
  }, [visibleCategories, otherGroup, query]);

  const switchGroup = (g: LinkGroup) => {
    setActiveGroup(g);
    setActiveCategory(ALL);
  };

  const groups: LinkGroup[] = ["mango", "nefcon"];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Links</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          망고단 링크 정보 모음
        </p>
      </header>

      {/* 영역 토글: 망고단 / 네프콘 */}
      <div className="mb-4 inline-flex rounded-lg border border-border bg-card p-0.5">
        {groups.map((g) => {
          const active = activeGroup === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => switchGroup(g)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {GROUP_LABEL[g]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  active ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {groupCounts[g]}
              </span>
            </button>
          );
        })}
      </div>

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
          {groupCategories.map((c) => (
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
          {query.trim() ? (
            <div className="space-y-2">
              <p>이 영역에는 검색 결과가 없습니다.</p>
              {otherGroupMatches > 0 ? (
                <button
                  type="button"
                  onClick={() => switchGroup(otherGroup)}
                  className="font-medium text-primary hover:underline"
                >
                  {GROUP_LABEL[otherGroup]} 영역에서 {otherGroupMatches}건 보기 →
                </button>
              ) : null}
            </div>
          ) : (
            "등록된 링크가 없습니다."
          )}
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
                    episodes={link.episodes}
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
