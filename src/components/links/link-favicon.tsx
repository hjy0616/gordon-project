"use client";

import { useMemo, useState } from "react";
import { Link as LinkIcon } from "lucide-react";

interface LinkFaviconProps {
  url: string;
  size?: number;
}

export function LinkFavicon({ url, size = 20 }: LinkFaviconProps) {
  const [failed, setFailed] = useState(false);

  const host = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  }, [url]);

  if (!host || failed) {
    return (
      <LinkIcon
        className="shrink-0 text-muted-foreground"
        style={{ width: size, height: size }}
      />
    );
  }

  const src = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className="shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}
