"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { LinkFavicon } from "./link-favicon";
import type { LinkEpisode } from "@/lib/links/types";

interface LinkCardProps {
  title: string;
  author: string | null;
  url: string;
  description: string | null;
  episodes?: LinkEpisode[] | null;
}

export function LinkCard({
  title,
  author,
  url,
  description,
  episodes,
}: LinkCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasEpisodes = !!episodes && episodes.length > 0;

  if (hasEpisodes) {
    return (
      <div className="group relative rounded-lg border border-border bg-card transition-colors hover:border-primary/40 hover:bg-accent/30">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 p-3"
        >
          <div className="mt-0.5">
            <LinkFavicon url={url} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-foreground group-hover:underline">
              {title}
            </div>
            {description ? (
              <div className="line-clamp-1 text-sm text-muted-foreground">
                {description}
              </div>
            ) : null}
          </div>
          <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100" />
        </a>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1 px-3 pb-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
        >
          네프콘 · {episodes!.length}개 회차
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
        {expanded ? (
          <ul className="space-y-1 px-3 pb-3">
            {episodes!.map((e, i) => (
              <li
                key={`${e.no}-${i}`}
                className="flex gap-2 text-xs text-muted-foreground"
              >
                <span className="shrink-0 font-mono text-foreground/70">
                  {e.no}
                </span>
                <span className="min-w-0">{e.title}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/30"
    >
      <div className="mt-0.5">
        <LinkFavicon url={url} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground group-hover:underline">
          {title}
        </div>
        {description ? (
          <div className="line-clamp-1 text-sm text-muted-foreground">
            {description}
          </div>
        ) : null}
        {author ? (
          <div className="mt-0.5 font-mono text-xs text-muted-foreground">
            {author}
          </div>
        ) : null}
      </div>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100" />
    </a>
  );
}
