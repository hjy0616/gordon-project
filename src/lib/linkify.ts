const URL_REGEX = /(https?:\/\/[^\s<>"')\]]+)/g;

export interface TextSegment {
  type: "text" | "url";
  value: string;
}

export function splitByUrls(text: string): TextSegment[] {
  const parts: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "url", value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function hasUrls(text: string): boolean {
  return /https?:\/\/[^\s<>"')\]]+/.test(text);
}
