import type { LinkEpisode } from "./types";

export type ParsedTab = "nefcon" | "mango";

export interface ParsedLink {
  tab: ParsedTab;
  category: string;
  title: string;
  url: string;
  author: string | null; // mango: "@handle", nefcon: null
  episodes: LinkEpisode[] | null; // nefcon: [...], mango: null
}

/** 매칭/중복판정용 URL 정규화: host 소문자 + www. 제거 + 끝 / 제거 + path+search 유지 + hash 무시. */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const path = u.pathname.replace(/\/$/, "");
    return host + path + u.search;
  } catch {
    return raw.trim().toLowerCase();
  }
}

function normalizeAuthorHandle(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

function cleanCategory(line: string): string {
  // "## 1. 🏛️ 공시 / 내부자 거래" → "공시 / 내부자 거래"
  let n = line.replace(/^##\s+/, "").replace(/^\d+\.\s*/, "");
  n = n.replace(/^[^\w가-힣A-Za-z]+/, "").trim();
  return n;
}

/** ".claude/url-update.md" 본문 → ParsedLink[]. 순수 함수(파일 I/O 없음). */
export function parseUrlUpdateMarkdown(md: string): ParsedLink[] {
  const lines = md.split(/\r?\n/);
  const out: ParsedLink[] = [];

  let tab: ParsedTab | null = null;
  let category = "";
  let pendingTitle: string | null = null;
  let pendingUrl: string | null = null;
  let episodeLines: string[] = [];
  let authorLine: string | null = null;

  const flush = () => {
    if (tab && pendingTitle && pendingUrl) {
      const episodes: LinkEpisode[] = [];
      for (const raw of episodeLines) {
        const m = /^(\d+)\.\s*(.*)$/.exec(raw);
        if (m) episodes.push({ no: m[1], title: m[2].trim() });
      }
      out.push({
        tab,
        category,
        title: pendingTitle,
        url: pendingUrl,
        author:
          tab === "mango" && authorLine
            ? normalizeAuthorHandle(authorLine)
            : null,
        episodes: tab === "nefcon" && episodes.length > 0 ? episodes : null,
      });
    }
    pendingTitle = null;
    pendingUrl = null;
    episodeLines = [];
    authorLine = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("# ") && line.includes("탭 1")) {
      flush();
      tab = "nefcon";
      category = "";
      continue;
    }
    if (line.startsWith("# ") && line.includes("탭 2")) {
      flush();
      tab = "mango";
      category = "";
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      category = cleanCategory(line);
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      pendingTitle = line.replace(/^###\s+/, "").trim();
      continue;
    }
    if (pendingTitle && !pendingUrl && /^https?:\/\//.test(line)) {
      pendingUrl = line;
      continue;
    }
    if (pendingTitle && pendingUrl) {
      if (line.startsWith("- ")) episodeLines.push(line.slice(2).trim());
      else if (/^_by\s+/.test(line))
        authorLine = line.replace(/^_by\s+/, "").replace(/_$/, "").trim();
    }
  }
  flush();
  return out;
}
