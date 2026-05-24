export const IMAGE_MAX_FILE_SIZE = 5 * 1024 * 1024;
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_ALLOWED_EXT_RE = /\.(jpe?g|png|webp)$/i;
export const IMAGE_ACCEPT_ATTR =
  "image/jpeg,image/png,image/webp,image/heic,image/heif";

const HEIC_TYPES = ["image/heic", "image/heif"];
const HEIC_EXT_RE = /\.(heic|heif)$/i;

export async function normalizeImageFile(
  raw: File
): Promise<{ file: File } | { error: string }> {
  const isHeic =
    HEIC_TYPES.includes(raw.type) ||
    (raw.type === "" && HEIC_EXT_RE.test(raw.name));

  if (!isHeic) return { file: raw };

  try {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: raw,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const file = new File(
      [blob],
      raw.name.replace(HEIC_EXT_RE, ".jpg"),
      { type: "image/jpeg" }
    );
    return { file };
  } catch {
    return {
      error:
        "HEIC 이미지를 처리하지 못했습니다. JPG/PNG로 변환 후 다시 시도해주세요.",
    };
  }
}

export function validateImageFile(
  file: File
): { ok: true } | { ok: false; error: string } {
  const typeOk =
    IMAGE_ALLOWED_TYPES.includes(file.type) ||
    ((file.type === "" || file.type === "application/octet-stream") &&
      IMAGE_ALLOWED_EXT_RE.test(file.name));
  if (!typeOk) {
    return { ok: false, error: "JPG, PNG, WEBP 형식의 이미지만 허용됩니다." };
  }
  if (file.size > IMAGE_MAX_FILE_SIZE) {
    return { ok: false, error: "이미지 크기는 5MB 이하여야 합니다." };
  }
  return { ok: true };
}

export function resolveImageContentType(file: File): string | null {
  if (IMAGE_ALLOWED_TYPES.includes(file.type)) return file.type;
  if (file.type === "" || file.type === "application/octet-stream") {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
  }
  return null;
}
