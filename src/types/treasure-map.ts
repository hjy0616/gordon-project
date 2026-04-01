// ── Tab navigation ──
export type MainTabType = "overview" | "rights" | "haas" | "scenario";
export type RightsSubTabType = "usage" | "revenue" | "data";

// ── Panel mode ──
export type PanelMode = "view" | "create" | "list";

// ── Tier system ──
export type SurvivalTier = "HIGHEST" | "HIGH" | "MEDIUM" | "MODERATE" | "LOW";

// ── District data model ──
export interface KoreanDistrict {
  id: string;
  name_ko: string;
  name_en: string;
  region: string;
  tier: SurvivalTier;
  tierReason: string;
  criteria: DistrictCriteria;
  rightsData: DistrictRightsData;
  haasScores: HaaSScores;
}

// ── Stage 1: Fulfillment criteria ──
export interface DistrictCriteria {
  medianPrice: number; // 평당 매매가 (만원)
  priceGrowth5Y: number; // 5년 가격 상승률 (%)
  platformPotential: number; // 플랫폼 전환 가능성 (0-100)
  infrastructureScore: number; // 인프라 점수 (0-100)
  investorDemand: number; // 투자자 수요 (0-100)
}

// ── Stage 2: Rights data ──
export interface DistrictRightsData {
  avgJeonse: number; // 평균 전세가 (만원)
  avgWolse: number; // 평균 월세 (만원/월)
  haasEstimate: number; // HaaS 추정 구독료 (만원/월)
  institutionalROI: number[]; // 10-year annual ROI (%)
  tokenHolderROI: number[]; // 10-year annual ROI (%)
  radarScores: RadarScores;
}

export interface RadarScores {
  iotDensity: number;
  transactionVolume: number;
  uniqueVisitors: number;
  platformEngagement: number;
  dataQuality: number;
}

// ── Stage 3: HaaS scores ──
export interface HaaSScores {
  iot: number; // 0-20
  internet: number;
  buildingAutomation: number;
  energySubMetering: number;
  platformReadiness: number;
  regulatorySandbox: number;
  investorInterest: number;
}

export type HaaSCriterionKey = keyof HaaSScores;
export type HaaSTier = "PREMIUM" | "GOOD" | "EMERGING" | "NON_VIABLE";

// ── Stage 4: Scenario data ──
export interface ScenarioDataPoint {
  year: number;
  platformYield: number;
  nonPlatformYield: number;
}

// ── Tier colors ──
export const TIER_COLORS: Record<SurvivalTier, string> = {
  HIGHEST: "#A71C2E",
  HIGH: "#D4A843",
  MEDIUM: "#2E7D32",
  MODERATE: "#1976D2",
  LOW: "#757575",
};

export const TIER_LABELS: Record<SurvivalTier, string> = {
  HIGHEST: "최상위 생존지",
  HIGH: "고위 생존지",
  MEDIUM: "중위 생존지",
  MODERATE: "보통",
  LOW: "비관측 지역",
};

// ── HaaS tier config ──
export const HAAS_TIER_CONFIG: Record<
  HaaSTier,
  { label: string; minScore: number; color: string }
> = {
  PREMIUM: { label: "Premium", minScore: 80, color: "#A71C2E" },
  GOOD: { label: "Good", minScore: 60, color: "#D4A843" },
  EMERGING: { label: "Emerging", minScore: 40, color: "#2E7D32" },
  NON_VIABLE: { label: "Non-viable", minScore: 0, color: "#757575" },
};

// ── HaaS criteria config ──
export const HAAS_CRITERIA_CONFIG: {
  key: HaaSCriterionKey;
  label: string;
  label_ko: string;
}[] = [
  { key: "iot", label: "IoT Infrastructure", label_ko: "IoT 인프라" },
  { key: "internet", label: "Internet/5G", label_ko: "인터넷/5G" },
  {
    key: "buildingAutomation",
    label: "Building Automation",
    label_ko: "빌딩 자동화",
  },
  {
    key: "energySubMetering",
    label: "Energy Sub-metering",
    label_ko: "에너지 서브미터링",
  },
  {
    key: "platformReadiness",
    label: "Platform Readiness",
    label_ko: "플랫폼 준비도",
  },
  {
    key: "regulatorySandbox",
    label: "Regulatory Sandbox",
    label_ko: "규제 샌드박스",
  },
  {
    key: "investorInterest",
    label: "Investor Interest",
    label_ko: "투자자 관심도",
  },
];

// ── Criteria display config ──
export const CRITERIA_CONFIG: {
  key: keyof DistrictCriteria;
  label: string;
  unit: string;
}[] = [
  { key: "medianPrice", label: "평당 매매가", unit: "만원" },
  { key: "priceGrowth5Y", label: "5년 상승률", unit: "%" },
  { key: "platformPotential", label: "플랫폼 잠재력", unit: "/100" },
  { key: "infrastructureScore", label: "인프라 점수", unit: "/100" },
  { key: "investorDemand", label: "투자자 수요", unit: "/100" },
];

// ── District edits (per-district user inputs) ──
export interface DistrictEdits {
  haasScores?: Partial<HaaSScores>;
  radarScores?: Partial<RadarScores>;
  usageSimInputs?: {
    jeonseDeposit: number;
    wolseMonthly: number;
    haasSubscription: number;
  };
  revenueInputs?: RevenueScenarioInput;
}

export interface RevenueScenarioInput {
  holdingYears: number;
  tokenRatio: number;
  annualAppreciation: number;
}

export const DEFAULT_REVENUE_INPUTS: RevenueScenarioInput = {
  holdingYears: 10,
  tokenRatio: 40,
  annualAppreciation: 5,
};

// ── Helper: merge mock + user edits for HaaS ──
export function getEffectiveHaaS(
  mock: HaaSScores,
  edits?: Partial<HaaSScores>,
): HaaSScores {
  if (!edits) return mock;
  return { ...mock, ...edits };
}

// ── Helper: merge mock + user edits for radar ──
export function getEffectiveRadar(
  mock: RadarScores,
  edits?: Partial<RadarScores>,
): RadarScores {
  if (!edits) return mock;
  return { ...mock, ...edits };
}

// ── Helper: compute total HaaS score (0-100) ──
export function computeHaaSTotal(scores: HaaSScores): number {
  const total =
    scores.iot +
    scores.internet +
    scores.buildingAutomation +
    scores.energySubMetering +
    scores.platformReadiness +
    scores.regulatorySandbox +
    scores.investorInterest;
  return Math.round((total / 140) * 100);
}

// ── Helper: get HaaS tier from normalized score ──
export function getHaasTier(normalizedScore: number): HaaSTier {
  if (normalizedScore >= 80) return "PREMIUM";
  if (normalizedScore >= 60) return "GOOD";
  if (normalizedScore >= 40) return "EMERGING";
  return "NON_VIABLE";
}

// ── Custom district (user-created, pin marker on map) ──
export interface CustomDistrict extends KoreanDistrict {
  isCustom: true;
  lat: number;
  lng: number;
}

// ── District overrides (user edits to mock districts) ──
export interface DistrictOverrides {
  name_ko?: string;
  name_en?: string;
  region?: string;
  tier?: SurvivalTier;
  tierReason?: string;
  criteria?: Partial<DistrictCriteria>;
}

// ── Default district data for new custom districts ──
export const DEFAULT_CRITERIA: DistrictCriteria = {
  medianPrice: 0,
  priceGrowth5Y: 0,
  platformPotential: 0,
  infrastructureScore: 0,
  investorDemand: 0,
};

export const DEFAULT_RIGHTS_DATA: DistrictRightsData = {
  avgJeonse: 0,
  avgWolse: 0,
  haasEstimate: 0,
  institutionalROI: Array.from({ length: 10 }, () => 0),
  tokenHolderROI: Array.from({ length: 10 }, () => 0),
  radarScores: {
    iotDensity: 0,
    transactionVolume: 0,
    uniqueVisitors: 0,
    platformEngagement: 0,
    dataQuality: 0,
  },
};

export const DEFAULT_HAAS_SCORES: HaaSScores = {
  iot: 0,
  internet: 0,
  buildingAutomation: 0,
  energySubMetering: 0,
  platformReadiness: 0,
  regulatorySandbox: 0,
  investorInterest: 0,
};
