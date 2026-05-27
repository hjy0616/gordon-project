export interface ValidatedLinkInput {
  title: string;
  url: string;
  author: string;
  description: string | null;
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
  const author = normalizeAuthorHandle(authorRaw);
  if (!author) return { ok: false, error: "작성자를 입력해주세요." };
  if (author.length > 50) return { ok: false, error: "작성자는 50자 이하여야 합니다." };

  const descriptionRaw = typeof b.description === "string" ? b.description.trim() : "";
  if (descriptionRaw.length > 200)
    return { ok: false, error: "설명은 200자 이하여야 합니다." };
  const description = descriptionRaw === "" ? null : descriptionRaw;

  const categoryId = typeof b.categoryId === "string" ? b.categoryId.trim() : "";
  if (!categoryId) return { ok: false, error: "카테고리를 선택해주세요." };

  return { ok: true, value: { title, url, author, description, categoryId } };
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
