import type { LinkEpisode } from "./types";

export interface ValidatedLinkInput {
  title: string;
  url: string;
  author: string | null;
  description: string | null;
  episodes: LinkEpisode[] | null;
  categoryId: string;
}

const URL_PROTOCOLS = new Set(["http:", "https:"]);

export function normalizeAuthorHandle(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return URL_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}

function validateEpisodes(
  raw: unknown,
): { ok: true; value: LinkEpisode[] | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (!Array.isArray(raw)) return { ok: false, error: "회차 형식이 올바르지 않습니다." };
  if (raw.length > 200) return { ok: false, error: "회차는 200개 이하여야 합니다." };
  const out: LinkEpisode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const no = (typeof rec.no === "string" ? rec.no : "").trim();
    const title = (typeof rec.title === "string" ? rec.title : "").trim();
    if (!no && !title) continue;
    if (no.length > 16) return { ok: false, error: "회차 번호는 16자 이하여야 합니다." };
    if (title.length > 200) return { ok: false, error: "회차 제목은 200자 이하여야 합니다." };
    out.push({ no, title });
  }
  return { ok: true, value: out.length > 0 ? out : null };
}

export function validateLinkInput(
  body: unknown,
): { ok: true; value: ValidatedLinkInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "잘못된 요청 본문입니다." };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (!title) return { ok: false, error: "제목을 입력해주세요." };
  if (title.length > 120) return { ok: false, error: "제목은 120자 이하여야 합니다." };

  const url = typeof b.url === "string" ? b.url.trim() : "";
  if (!url) return { ok: false, error: "URL을 입력해주세요." };
  if (!isValidUrl(url))
    return { ok: false, error: "http 또는 https로 시작하는 올바른 URL을 입력해주세요." };

  const authorRaw = typeof b.author === "string" ? b.author : "";
  const authorNorm = normalizeAuthorHandle(authorRaw);
  if (authorNorm.length > 50)
    return { ok: false, error: "작성자는 50자 이하여야 합니다." };
  const author = authorNorm === "" ? null : authorNorm;

  const descriptionRaw = typeof b.description === "string" ? b.description.trim() : "";
  if (descriptionRaw.length > 200)
    return { ok: false, error: "설명은 200자 이하여야 합니다." };
  const description = descriptionRaw === "" ? null : descriptionRaw;

  const ep = validateEpisodes(b.episodes);
  if (!ep.ok) return { ok: false, error: ep.error };

  const categoryId = typeof b.categoryId === "string" ? b.categoryId.trim() : "";
  if (!categoryId) return { ok: false, error: "카테고리를 선택해주세요." };

  return {
    ok: true,
    value: { title, url, author, description, episodes: ep.value, categoryId },
  };
}

export function validateCategoryName(
  raw: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (!name) return { ok: false, error: "카테고리 이름을 입력해주세요." };
  if (name.length > 40)
    return { ok: false, error: "카테고리 이름은 40자 이하여야 합니다." };
  return { ok: true, value: name };
}
