"use client";

import { ExternalLink } from "lucide-react";
import { LinkFavicon } from "./link-favicon";

interface LinkCardProps {
  title: string;
  author: string;
  url: string;
  description: string | null;
}

export function LinkCard({ title, author, url, description }: LinkCardProps) {
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
        <div className="mt-0.5 font-mono text-xs text-muted-foreground">
          {author}
        </div>
      </div>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground opacity-50 group-hover:opacity-100" />
    </a>
  );
}
