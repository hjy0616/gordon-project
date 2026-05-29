export interface LinkEpisode {
  no: string;
  title: string;
}

/** Prisma Json 값(unknown)을 LinkEpisode[]로 안전 변환. 형태 안 맞으면 null. */
export function parseEpisodes(value: unknown): LinkEpisode[] | null {
  if (!Array.isArray(value)) return null;
  const out: LinkEpisode[] = [];
  for (const item of value) {
    if (item && typeof item === "object") {
      const rec = item as Record<string, unknown>;
      const no = typeof rec.no === "string" ? rec.no : "";
      const title = typeof rec.title === "string" ? rec.title : "";
      if (no || title) out.push({ no, title });
    }
  }
  return out.length > 0 ? out : null;
}
