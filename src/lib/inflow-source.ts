const SEARCH_ENGINE_HOSTS = [
  "google.",
  "bing.com",
  "duckduckgo.com",
  "naver.com",
  "daum.net",
  "yahoo.com",
  "yandex.",
  "baidu.com",
];

export type InflowInput = {
  utmSource?: string | null;
  referer?: string | null;
};

export function classifyInflowSource(input: InflowInput): string {
  const utm = (input.utmSource ?? "").trim();
  if (utm) return `utm:${utm.slice(0, 100)}`;

  const ref = (input.referer ?? "").trim();
  if (!ref) return "direct";

  let host = "";
  try {
    host = new URL(ref).hostname.toLowerCase();
  } catch {
    return "referral";
  }

  if (!host) return "direct";

  for (const needle of SEARCH_ENGINE_HOSTS) {
    if (host.includes(needle)) return "organic";
  }
  return "referral";
}
