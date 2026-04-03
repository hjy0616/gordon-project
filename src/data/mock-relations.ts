import type { CountryRelation, LineStyle } from "@/types/macro-map";

const RELATION_DEFAULTS: Record<"ally" | "rival", { color: string; lineStyle: LineStyle }> = {
  ally: { color: "#3b82f6", lineStyle: "solid" },
  rival: { color: "#800020", lineStyle: "dashed" },
};

/** 양방향 쌍 생성 헬퍼 */
function pair(
  a: string,
  b: string,
  type: "ally" | "rival",
): [CountryRelation, CountryRelation] {
  const { color, lineStyle } = RELATION_DEFAULTS[type];
  return [
    { id: `${a}-${b}`, from_iso: a, to_iso: b, type, color, lineStyle },
    { id: `${b}-${a}`, from_iso: b, to_iso: a, type, color, lineStyle },
  ];
}

export const MOCK_RELATIONS: CountryRelation[] = [
  // ── 동맹 (ally) ──
  ...pair("USA", "JPN", "ally"), // 미일동맹
  ...pair("USA", "KOR", "ally"), // 한미동맹
  ...pair("USA", "GBR", "ally"), // 미영 특수관계
  ...pair("USA", "AUS", "ally"), // AUKUS
  ...pair("USA", "DEU", "ally"), // NATO
  ...pair("USA", "CAN", "ally"), // NATO + 이웃
  ...pair("JPN", "AUS", "ally"), // 쿼드
  ...pair("JPN", "IND", "ally"), // 쿼드
  ...pair("DEU", "FRA", "ally"), // EU 핵심축

  // ── 적국 (rival) ──
  ...pair("USA", "CHN", "rival"), // G2 패권 경쟁
  ...pair("USA", "RUS", "rival"), // 신냉전
  ...pair("CHN", "JPN", "rival"), // 역사/영토 갈등
  ...pair("CHN", "IND", "rival"), // 국경 분쟁
  ...pair("RUS", "GBR", "rival"), // 긴장 관계
  ...pair("CHN", "AUS", "rival"), // 무역 분쟁
];
