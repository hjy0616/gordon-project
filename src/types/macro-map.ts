export type IndicatorType = "gdp_growth" | "interest_rate" | "inflation";

export interface CountryIndicators {
  iso_a3: string;
  name: string;
  name_ko: string;
  flag_emoji: string;
  gdp_growth: number;       // GDP 성장률 (%)
  interest_rate: number;     // 기준금리 (%)
  inflation: number;         // 인플레이션율 (%)
  gdp_nominal: number;      // 명목 GDP (십억 USD)
  unemployment: number;      // 실업률 (%)
  debt_to_gdp: number;      // 부채비율 (%)
  current_account: number;   // 경상수지 (GDP 대비 %)
}

export interface CapitalFlow {
  id: string;
  from_iso: string;
  to_iso: string;
  from_coords: [number, number]; // [lng, lat]
  to_coords: [number, number];
  volume: number;                // 규모 (십억 USD)
  type: "fdi" | "portfolio" | "trade";
  label: string;
  color: string;                 // 라인 색상 (기본: "#e67e22")
  lineStyle: LineStyle;          // 실선/점선 (기본: "dashed")
}

export type CountryNotes = Record<string, string>;

// ── 국가 간 관계 (7단계) ──
export type RelationType = "ally" | "rival";

export interface CountryRelation {
  id: string;           // `${from_iso}-${to_iso}`
  from_iso: string;
  to_iso: string;
  type: RelationType;
  color: string;        // 라인 색상 (기본: ally="#3b82f6", rival="#800020")
  lineStyle: LineStyle;  // 실선/점선 (기본: ally="solid", rival="dashed")
}

export type EditTab = "flow" | "relation";
export type LineStyle = "solid" | "dashed";

export interface EditPopoverState {
  x: number;
  y: number;
  targetIso: string;
  activeTab: EditTab;
}

export const LINE_COLOR_PRESETS = [
  { value: "#e67e22", label: "주황" },
  { value: "#3b82f6", label: "파랑" },
  { value: "#800020", label: "다크레드" },
  { value: "#22c55e", label: "초록" },
  { value: "#a855f7", label: "보라" },
  { value: "#eab308", label: "노랑" },
  { value: "#94a3b8", label: "회색" },
] as const;

/** 5대 핵심 능력 — 각 카테고리당 3개 텍스트 */
export type CapabilityEntries = [string, string, string];

export interface CoreCapabilities {
  most_wanted: CapabilityEntries;       // 가장 갖고 싶어 하는 능력
  must_keep: CapabilityEntries;         // 절대 잃으면 안 되는 능력
  strongest: CapabilityEntries;         // 이미 가진 가장 강력한 능력
  weakest: CapabilityEntries;           // 가장 취약한 약점 요소
  longest_strength: CapabilityEntries;  // 가장 오랜 시간 자신 있는 능력
}

export type CapabilityKey = keyof CoreCapabilities;

export const CAPABILITY_CONFIG: {
  key: CapabilityKey;
  label: string;
  placeholder: string;
}[] = [
  { key: "most_wanted", label: "갖고 싶은 능력", placeholder: "이 국가가 가장 원하는 능력" },
  { key: "must_keep", label: "잃으면 안 되는 능력", placeholder: "절대 잃어선 안 되는 핵심 능력" },
  { key: "strongest", label: "가장 강력한 능력", placeholder: "이미 보유한 가장 강한 능력" },
  { key: "weakest", label: "가장 취약한 약점", placeholder: "가장 취약한 약점 요소" },
  { key: "longest_strength", label: "오래된 자신 있는 능력", placeholder: "가장 오랜 시간 유지해온 강점" },
];

export const EMPTY_CAPABILITIES: CoreCapabilities = {
  most_wanted: ["", "", ""],
  must_keep: ["", "", ""],
  strongest: ["", "", ""],
  weakest: ["", "", ""],
  longest_strength: ["", "", ""],
};

export interface CountryEditableData {
  population: number | null;       // 총인구수 (만 명)
  gdp: number | null;              // GDP (십억 USD)
  gni: number | null;              // GNI (십억 USD)
  gni_per_capita: number | null;   // 1인당 GNI (USD)
  national_debt: number | null;    // 국가채무 (십억 USD)
  key_industries: string[];        // 핵심 산업 (뱃지 배열)
  tech_capability: string;         // 기술력
  military_rank: number | null;    // 세계 군사력 순위
  core_capabilities: CoreCapabilities | null; // 5대 핵심 능력
}

export type CountryEdits = Record<string, Partial<CountryEditableData>>;

export const DETAIL_FIELD_CONFIG = [
  { key: "population",     label: "총인구수",  unit: "만 명" },
  { key: "gdp",            label: "GDP",       unit: "십억$" },
  { key: "gni",            label: "GNI",       unit: "십억$" },
  { key: "gni_per_capita", label: "1인당 GNI", unit: "USD" },
  { key: "national_debt",  label: "국가채무",   unit: "십억$" },
] as const;

export const CONTINENT_OPTIONS = [
  "북아메리카", "남아메리카", "유럽", "동북아시아",
  "동남아시아", "남아시아", "중동", "오세아니아", "아프리카",
] as const;
export type ContinentType = (typeof CONTINENT_OPTIONS)[number];

export interface MacroMapState {
  activeIndicator: IndicatorType;
  selectedCountry: string | null;
  selectedCountryName: string | null;
  hoveredCountry: string | null;
  hoverPos: { x: number; y: number } | null;
  notes: CountryNotes;
  showFlows: boolean;
  showRanking: boolean;
  showScorecard: boolean;
  continentTags: Record<string, string>;
  countryEdits: CountryEdits;
  // 자본흐름 CRUD
  capitalFlows: CapitalFlow[];
  // 7단계: 관계선
  relations: CountryRelation[];
  showRelations: boolean;
  // 통합 편집 모드
  editMode: boolean;
  editBase: string | null;
  editPopover: EditPopoverState | null;
}

export interface MacroMapActions {
  setIndicator: (indicator: IndicatorType) => void;
  selectCountry: (iso: string | null, englishName?: string) => void;
  setHovered: (iso: string | null, pos?: { x: number; y: number }) => void;
  updateNote: (iso: string, note: string) => void;
  toggleFlows: () => void;
  toggleRanking: () => void;
  toggleScorecard: () => void;
  setContinentTag: (iso: string, continent: string) => void;
  updateCountryEdit: <K extends keyof CountryEditableData>(
    iso: string,
    field: K,
    value: CountryEditableData[K],
  ) => void;
  // 자본흐름 CRUD
  addFlow: (from: string, to: string, type: CapitalFlow["type"], volume: number, label: string, color: string, lineStyle: LineStyle) => void;
  updateFlow: (id: string, updates: Partial<Pick<CapitalFlow, "type" | "volume" | "label" | "color" | "lineStyle">>) => void;
  removeFlow: (id: string) => void;
  // 관계선
  toggleRelations: () => void;
  addRelation: (from: string, to: string, type: RelationType, color: string, lineStyle: LineStyle) => void;
  removeRelation: (id: string) => void;
  // 통합 편집 모드
  toggleEditMode: () => void;
  setEditBase: (iso: string | null) => void;
  showEditPopover: (x: number, y: number, targetIso: string, activeTab: EditTab) => void;
  hideEditPopover: () => void;
  setEditTab: (tab: EditTab) => void;
}

export const INDICATOR_CONFIG: Record<
  IndicatorType,
  { label: string; unit: string; colorRange: [string, string] }
> = {
  gdp_growth: {
    label: "GDP 성장률",
    unit: "%",
    colorRange: ["#1a1a2e", "#e67e22"],
  },
  interest_rate: {
    label: "기준금리",
    unit: "%",
    colorRange: ["#1a1a2e", "#e74c3c"],
  },
  inflation: {
    label: "인플레이션",
    unit: "%",
    colorRange: ["#1a1a2e", "#f39c12"],
  },
};
