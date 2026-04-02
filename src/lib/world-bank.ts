/**
 * World Bank API v2 클라이언트
 * https://api.worldbank.org/v2/
 */

/** 30개국 ISO Alpha-2 코드 (World Bank는 Alpha-2 사용) */
export const WB_COUNTRIES = [
  "US", "CN", "JP", "DE", "GB", "FR", "IN", "BR", "KR", "CA",
  "AU", "MX", "ID", "RU", "SA", "TR", "ZA", "AR", "TH", "EG",
  "VN", "NG", "PL", "SE", "CH", "NO", "SG", "MY", "PH", "CL",
] as const;

/** ISO A2 → A3 매핑 */
const A2_TO_A3: Record<string, string> = {
  US: "USA", CN: "CHN", JP: "JPN", DE: "DEU", GB: "GBR", FR: "FRA",
  IN: "IND", BR: "BRA", KR: "KOR", CA: "CAN", AU: "AUS", MX: "MEX",
  ID: "IDN", RU: "RUS", SA: "SAU", TR: "TUR", ZA: "ZAF", AR: "ARG",
  TH: "THA", EG: "EGY", VN: "VNM", NG: "NGA", PL: "POL", SE: "SWE",
  CH: "CHE", NO: "NOR", SG: "SGP", MY: "MYS", PH: "PHL", CL: "CHL",
};

const WB_BASE = "https://api.worldbank.org/v2";

interface WBIndicatorEntry {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

/** 지표 코드 → 필드명 매핑 */
export const INDICATOR_CODES = {
  gdp_growth: "NY.GDP.MKTP.KD.ZG",
  inflation: "FP.CPI.TOTL.ZG",
  unemployment: "SL.UEM.TOTL.ZS",
  gdp_nominal: "NY.GDP.MKTP.CD",
  debt_to_gdp: "GC.DOD.TOTL.GD.ZS",
  current_account: "BN.CAB.XOKA.GD.ZS",
} as const;

export const DETAIL_CODES = {
  population: "SP.POP.TOTL",
  gdp: "NY.GDP.MKTP.CD",
  gni: "NY.GNP.MKTP.CD",
  gni_per_capita: "NY.GNP.PCAP.CD",
} as const;

type IndicatorField = keyof typeof INDICATOR_CODES;
type DetailField = keyof typeof DETAIL_CODES;

/**
 * 단일 지표에 대해 30개국 최신값을 가져온다.
 * MRV=1 → most recent value 1개
 */
export async function fetchIndicator(
  indicatorCode: string,
): Promise<Map<string, number | null>> {
  const countries = WB_COUNTRIES.join(";");
  const url = `${WB_BASE}/country/${countries}/indicator/${indicatorCode}?format=json&per_page=500&MRV=1`;

  const result = new Map<string, number | null>();

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[WB API] ${indicatorCode} returned ${res.status}`);
      return result;
    }

    const json = await res.json();
    const data: WBIndicatorEntry[] = json[1] ?? [];

    for (const entry of data) {
      const a3 = A2_TO_A3[entry.country.id] ?? entry.countryiso3code;
      if (a3 && !result.has(a3)) {
        result.set(a3, entry.value);
      }
    }
  } catch (err) {
    console.error(`[WB API] ${indicatorCode} fetch failed:`, err);
  }

  return result;
}

/** 단위 변환 함수 */
function convertUnit(field: string, value: number | null): number | null {
  if (value === null) return null;
  switch (field) {
    case "gdp_nominal":
    case "gdp":
    case "gni":
    case "national_debt":
      return Math.round(value / 1_000_000_000);
    case "population":
      return Math.round(value / 10_000);
    case "gni_per_capita":
      return Math.round(value);
    default:
      return Math.round(value * 10) / 10;
  }
}

/**
 * 30개국 기본 거시경제 지표를 모두 가져온다.
 * 반환: Map<iso_a3, { gdp_growth, inflation, ... }>
 */
export async function fetchAllIndicators(): Promise<
  Map<string, Record<IndicatorField, number | null>>
> {
  const fields = Object.entries(INDICATOR_CODES) as [IndicatorField, string][];
  const results = await Promise.all(
    fields.map(async ([field, code]) => {
      const data = await fetchIndicator(code);
      return { field, data };
    }),
  );

  const merged = new Map<string, Record<IndicatorField, number | null>>();

  for (const a3 of Object.values(A2_TO_A3)) {
    const entry = {} as Record<IndicatorField, number | null>;
    for (const { field, data } of results) {
      entry[field] = convertUnit(field, data.get(a3) ?? null);
    }
    merged.set(a3, entry);
  }

  return merged;
}

/**
 * 30개국 상세 경제 데이터를 가져온다.
 * 반환: Map<iso_a3, { population, gdp, gni, gni_per_capita }>
 */
export async function fetchAllDetails(): Promise<
  Map<string, Record<DetailField, number | null>>
> {
  const fields = Object.entries(DETAIL_CODES) as [DetailField, string][];
  const results = await Promise.all(
    fields.map(async ([field, code]) => {
      const data = await fetchIndicator(code);
      return { field, data };
    }),
  );

  const merged = new Map<string, Record<DetailField, number | null>>();

  for (const a3 of Object.values(A2_TO_A3)) {
    const entry = {} as Record<DetailField, number | null>;
    for (const { field, data } of results) {
      entry[field] = convertUnit(field, data.get(a3) ?? null);
    }
    merged.set(a3, entry);
  }

  return merged;
}
