export type EventCategory =
  | "interest_rate"
  | "exchange_rate"
  | "banking_crisis"
  | "geopolitics"
  | "bubble";

export type ReversibilityLevel =
  | "reversible"
  | "partially_reversible"
  | "irreversible";

export type ActionDecision =
  | "do_nothing"
  | "observe"
  | "defend"
  | "partial_execute"
  | "custom";

export type PanelMode = "list" | "create";

export type MainView = "stepper" | "mindmap" | "summary";

export interface StepData {
  completed: boolean;
  domains?: string[];
  domainNotes?: string;
  surfaceCause?: string;
  rootCause?: string;
  amplifiers?: string[];
  amplifierNotes?: string;
  transmissionNotes?: string;
  hasChanges?: boolean;
  conditionNotes?: string;
  liquidityNotes?: string;
  reversibility?: ReversibilityLevel;
  reversibilityReason?: string;
  exclusions?: string[];
  action?: ActionDecision;
  actionNotes?: string;
}

export interface CrowdAnalysis {
  emotion: string;
  action: string;
  narrative: string;
}

export interface MyAnalysis {
  structure: string;
  action: string;
  reason: string;
}

export interface FlowNodeData {
  label: string;
  description?: string;
}

export interface SimFlowNode {
  id: string;
  type: "event" | "transmission" | "liquidity";
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface SimFlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  style?: { stroke?: string; strokeDasharray?: string };
}

export interface Simulation {
  id: string;
  title: string;
  eventType: string;
  eventDescription: string;
  currentStep: number;
  status: "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  steps: Record<number, StepData>;
  crowdAnalysis: CrowdAnalysis;
  myAnalysis: MyAnalysis;
  flowNodes: SimFlowNode[];
  flowEdges: SimFlowEdge[];
}

export const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "interest_rate", label: "금리" },
  { value: "exchange_rate", label: "환율" },
  { value: "banking_crisis", label: "은행 위기" },
  { value: "geopolitics", label: "지정학" },
  { value: "bubble", label: "버블" },
];

export const DOMAIN_TAGS = [
  "금융",
  "통화",
  "기술",
  "공급망",
  "심리",
  "지정학",
] as const;

export const AMPLIFIER_OPTIONS = [
  { key: "media", label: "미디어 과열" },
  { key: "leverage", label: "레버리지" },
  { key: "herd", label: "대중 심리 (FOMO/공포)" },
  { key: "political", label: "정치적 이용" },
  { key: "other", label: "기타" },
] as const;

export const ACTION_OPTIONS: { value: ActionDecision; label: string }[] = [
  { value: "do_nothing", label: "아무것도 안 한다" },
  { value: "observe", label: "관망" },
  { value: "defend", label: "방어" },
  { value: "partial_execute", label: "분할 소액 실행" },
  { value: "custom", label: "기타" },
];

export const STEP_CONFIG = [
  { num: 1, label: "영역 분류", shortLabel: "Domain" },
  { num: 2, label: "원인 분리", shortLabel: "Cause" },
  { num: 3, label: "증폭 요소", shortLabel: "Amplify" },
  { num: 4, label: "전이 경로", shortLabel: "Path" },
  { num: 5, label: "조건 변화", shortLabel: "Condition" },
  { num: 6, label: "유동성 방향", shortLabel: "Liquidity" },
  { num: 7, label: "되돌림 가능성", shortLabel: "Reverse" },
  { num: 8, label: "행동 판정", shortLabel: "Action" },
] as const;

export const STEP_PROMPTS: Record<number, string> = {
  1: "이 사건은 어디 영역인가? 한 가지가 아닐 수 있다.",
  2: "이건 진짜 원인인가? 표면 현상인가? 근원을 찾아라.",
  3: "미디어나 레버리지나 대중 심리가 과도하게 거품을 키우고 있는지?",
  4: "이 충격은 다음 순서로 어디로 번질 수 있는지 체크해라.",
  5: "계약 기간/담보/규제/설명이 바뀌고 있는지 확인해라.",
  6: "돈은 어디서 빠져나와 어디로 가고 있는지 흐름을 분석해라.",
  7: "이 결정은 되돌릴 수 있는지? 비가역적인지 명확하게 구분해라.",
  8: "뭘 할지를 결정하지 말고, 뭘 하면 안 되는지부터 적고 배제하고 제거해라.",
};

export function createEmptySimulation(
  title: string,
  eventType: string,
  eventDescription: string,
): Simulation {
  return {
    id: crypto.randomUUID(),
    title,
    eventType,
    eventDescription,
    currentStep: 1,
    status: "in_progress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: {},
    crowdAnalysis: { emotion: "", action: "", narrative: "" },
    myAnalysis: { structure: "", action: "", reason: "" },
    flowNodes: [],
    flowEdges: [],
  };
}
