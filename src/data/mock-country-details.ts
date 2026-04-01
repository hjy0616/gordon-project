import type { CountryEditableData, CountryEdits } from "@/types/macro-map";

/** mock 데이터는 core_capabilities 없이 정의 (사용자 입력 전용) */
type MockCountryData = Omit<CountryEditableData, "core_capabilities">;

/** 30개국 기본 경제·역량 데이터 (World Bank / IMF / Global Firepower 2024 기준) */
export const DEFAULT_COUNTRY_DETAILS: Record<string, MockCountryData> = {
  USA: {
    population: 33490, gdp: 26950, gni: 26300, gni_per_capita: 76370, national_debt: 33100,
    key_industries: ["IT/반도체", "금융", "항공우주", "바이오/제약", "에너지"],
    tech_capability: "최상위 (AI, 우주, 반도체)", military_rank: 1,
  },
  CHN: {
    population: 141200, gdp: 17960, gni: 17800, gni_per_capita: 12850, national_debt: 14000,
    key_industries: ["제조업", "전자/통신", "인프라건설", "신재생에너지", "전기차"],
    tech_capability: "상위 (5G, AI, 우주, 양자컴퓨팅)", military_rank: 3,
  },
  JPN: {
    population: 12440, gdp: 4230, gni: 4950, gni_per_capita: 42440, national_debt: 9200,
    key_industries: ["자동차", "전자/로봇", "정밀기계", "소재/화학", "게임/콘텐츠"],
    tech_capability: "상위 (로봇, 소재, 자동차)", military_rank: 7,
  },
  DEU: {
    population: 8430, gdp: 4430, gni: 4300, gni_per_capita: 51680, national_debt: 2800,
    key_industries: ["자동차", "기계/엔지니어링", "화학", "의약", "전자"],
    tech_capability: "상위 (자동차, 기계, 화학)", military_rank: 16,
  },
  GBR: {
    population: 6730, gdp: 3330, gni: 3200, gni_per_capita: 48890, national_debt: 3300,
    key_industries: ["금융", "항공우주", "바이오/제약", "에너지", "크리에이티브"],
    tech_capability: "상위 (금융기술, AI, 바이오)", military_rank: 5,
  },
  FRA: {
    population: 6780, gdp: 3050, gni: 2950, gni_per_capita: 44100, national_debt: 3300,
    key_industries: ["항공우주", "럭셔리/패션", "원자력", "농식품", "관광"],
    tech_capability: "상위 (원자력, 항공, 우주)", military_rank: 9,
  },
  IND: {
    population: 142860, gdp: 3730, gni: 3600, gni_per_capita: 2540, national_debt: 3100,
    key_industries: ["IT서비스", "제약", "섬유", "자동차", "농업"],
    tech_capability: "중상위 (IT서비스, 우주, 제약)", military_rank: 4,
  },
  BRA: {
    population: 21640, gdp: 2130, gni: 2050, gni_per_capita: 9960, national_debt: 1600,
    key_industries: ["농업/축산", "광업", "석유", "항공기", "자동차"],
    tech_capability: "중간 (농업기술, 심해유전)", military_rank: 12,
  },
  KOR: {
    population: 5175, gdp: 1710, gni: 1680, gni_per_capita: 33790, national_debt: 1068,
    key_industries: ["반도체", "자동차", "조선", "디스플레이", "K-콘텐츠"],
    tech_capability: "상위 (반도체, 디스플레이, 배터리)", military_rank: 6,
  },
  CAN: {
    population: 4050, gdp: 2140, gni: 2080, gni_per_capita: 52960, national_debt: 1600,
    key_industries: ["에너지/석유", "광업", "금융", "항공우주", "IT"],
    tech_capability: "중상위 (AI, 자원기술)", military_rank: 27,
  },
  AUS: {
    population: 2660, gdp: 1690, gni: 1640, gni_per_capita: 63140, national_debt: 680,
    key_industries: ["광업/자원", "농업", "금융", "교육", "관광"],
    tech_capability: "중상위 (광업기술, 바이오)", military_rank: 16,
  },
  MEX: {
    population: 12890, gdp: 1320, gni: 1260, gni_per_capita: 10820, national_debt: 710,
    key_industries: ["자동차", "전자제조", "석유", "농업", "관광"],
    tech_capability: "중간 (자동차 제조)", military_rank: 31,
  },
  IDN: {
    population: 27750, gdp: 1320, gni: 1270, gni_per_capita: 4580, national_debt: 510,
    key_industries: ["팜유", "석탄/광업", "제조업", "관광", "수산업"],
    tech_capability: "중간 (디지털 경제 성장)", military_rank: 13,
  },
  RUS: {
    population: 14400, gdp: 1860, gni: 1800, gni_per_capita: 12830, national_debt: 390,
    key_industries: ["에너지/천연가스", "군수산업", "광업", "항공우주", "농업"],
    tech_capability: "중상위 (우주, 군사, 원자력)", military_rank: 2,
  },
  SAU: {
    population: 3680, gdp: 1060, gni: 1000, gni_per_capita: 27610, national_debt: 300,
    key_industries: ["석유/가스", "석유화학", "건설", "금융", "관광"],
    tech_capability: "중간 (석유기술, 스마트시티)", military_rank: 22,
  },
  TUR: {
    population: 8530, gdp: 1110, gni: 1050, gni_per_capita: 13110, national_debt: 400,
    key_industries: ["자동차", "섬유/의류", "건설", "전자", "식품"],
    tech_capability: "중간 (드론, 방산)", military_rank: 8,
  },
  ZAF: {
    population: 6080, gdp: 399, gni: 380, gni_per_capita: 6780, national_debt: 290,
    key_industries: ["광업/금", "자동차", "금융", "농업", "관광"],
    tech_capability: "중간 (광업기술)", military_rank: 33,
  },
  ARG: {
    population: 4640, gdp: 632, gni: 600, gni_per_capita: 13650, national_debt: 400,
    key_industries: ["농업/축산", "석유/가스", "자동차", "식품가공", "리튬"],
    tech_capability: "중간 (농업기술, 원자력)", military_rank: 28,
  },
  THA: {
    population: 7180, gdp: 515, gni: 490, gni_per_capita: 7060, national_debt: 320,
    key_industries: ["관광", "자동차", "전자", "농업", "식품"],
    tech_capability: "중간 (자동차 제조허브)", military_rank: 25,
  },
  EGY: {
    population: 11050, gdp: 395, gni: 370, gni_per_capita: 3900, national_debt: 360,
    key_industries: ["관광", "수에즈운하", "석유/가스", "섬유", "농업"],
    tech_capability: "중하위 (에너지 인프라)", military_rank: 15,
  },
  VNM: {
    population: 10030, gdp: 430, gni: 410, gni_per_capita: 4010, national_debt: 160,
    key_industries: ["전자조립", "섬유/의류", "농업", "수산업", "관광"],
    tech_capability: "중간 (전자 제조허브 성장)", military_rank: 19,
  },
  NGA: {
    population: 22380, gdp: 363, gni: 350, gni_per_capita: 1620, national_debt: 110,
    key_industries: ["석유/가스", "농업", "통신", "영화/놀리우드", "금융"],
    tech_capability: "중하위 (핀테크 성장)", military_rank: 36,
  },
  POL: {
    population: 3770, gdp: 842, gni: 810, gni_per_capita: 18030, national_debt: 410,
    key_industries: ["자동차", "IT/BPO", "기계", "식품", "가전"],
    tech_capability: "중간 (IT서비스, 게임개발)", military_rank: 21,
  },
  SWE: {
    population: 1050, gdp: 593, gni: 580, gni_per_capita: 61560, national_debt: 200,
    key_industries: ["자동차", "통신/IT", "의약", "기계", "방산"],
    tech_capability: "상위 (통신, 혁신기술)", military_rank: 31,
  },
  CHE: {
    population: 890, gdp: 884, gni: 870, gni_per_capita: 93720, national_debt: 340,
    key_industries: ["금융", "제약/바이오", "정밀기계", "식품", "시계"],
    tech_capability: "최상위 (제약, 정밀기계)", military_rank: 30,
  },
  NOR: {
    population: 550, gdp: 485, gni: 470, gni_per_capita: 87830, national_debt: 210,
    key_industries: ["석유/가스", "수산업", "해운", "신재생에너지", "IT"],
    tech_capability: "상위 (에너지기술, 해양)", military_rank: 37,
  },
  SGP: {
    population: 600, gdp: 497, gni: 480, gni_per_capita: 67200, national_debt: 810,
    key_industries: ["금융", "반도체", "석유화학", "물류/항만", "바이오"],
    tech_capability: "상위 (금융기술, 반도체)", military_rank: 40,
  },
  MYS: {
    population: 3400, gdp: 410, gni: 390, gni_per_capita: 11830, national_debt: 270,
    key_industries: ["전자/반도체", "팜유", "석유/가스", "관광", "자동차"],
    tech_capability: "중간 (반도체 패키징허브)", military_rank: 36,
  },
  PHL: {
    population: 11700, gdp: 435, gni: 420, gni_per_capita: 3950, national_debt: 270,
    key_industries: ["전자조립", "BPO/콜센터", "농업", "관광", "해외송금"],
    tech_capability: "중하위 (BPO 강점)", military_rank: 29,
  },
  CHL: {
    population: 1980, gdp: 335, gni: 320, gni_per_capita: 16800, national_debt: 130,
    key_industries: ["구리/광업", "농업/와인", "수산업", "리튬", "임업"],
    tech_capability: "중간 (광업기술, 천문학)", military_rank: 47,
  },
};

/** mock 기본값 + 사용자 편집을 병합하여 국가 상세 데이터 반환 */
export function getCountryDetail(
  iso: string,
  edits: CountryEdits,
): CountryEditableData | null {
  const defaults = DEFAULT_COUNTRY_DETAILS[iso];
  const userEdits = edits[iso];
  if (!defaults && !userEdits) return null;
  if (!defaults) return userEdits as CountryEditableData;
  if (!userEdits) return { ...defaults, core_capabilities: null };
  return {
    ...defaults,
    core_capabilities: null,
    ...userEdits,
    // key_industries는 배열이므로 userEdits가 있으면 완전히 대체
    key_industries: userEdits.key_industries ?? defaults.key_industries,
  };
}
