import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MacroMapState,
  MacroMapActions,
  IndicatorType,
  CountryEditableData,
  RelationType,
  SuperpowerCode,
  EconomicIssue,
} from "@/types/macro-map";
import { EMPTY_ANALYSIS } from "@/types/macro-map";
import { MOCK_RELATIONS } from "@/data/mock-relations";
import { COUNTRY_CENTROIDS } from "@/data/country-centroids";

export const useMacroMapStore = create<MacroMapState & MacroMapActions>()(
  persist(
    (set) => ({
      activeIndicator: "gdp_growth",
      selectedCountry: null,
      selectedCountryName: null,
      hoveredCountry: null,
      notes: {},
      showFlows: true,
      capitalFlows: [],
      flowEditMode: false,
      flowEditBase: null,
      flowPopover: null,
      showRanking: false,
      showScorecard: false,
      continentTags: {},
      countryEdits: {},
      // 7단계: 관계선
      relations: MOCK_RELATIONS,
      showRelations: false,
      relationEditMode: false,
      relationEditBase: null,
      relationPopover: null,
      // 8단계: G2 시뮬레이션
      activeTab: "map" as const,
      activeSuperpower: "USA" as SuperpowerCode,
      objectives: {
        USA: { principle: "", strategicIntent: "" },
        CHN: { principle: "", strategicIntent: "" },
      },
      countryGroupings: { USA: {}, CHN: {} },
      issues: { USA: [] as EconomicIssue[], CHN: [] as EconomicIssue[] },
      expandedIssueId: null,
      issueBarExpanded: false,

      setIndicator: (indicator: IndicatorType) =>
        set({ activeIndicator: indicator }),

      selectCountry: (iso: string | null, englishName?: string) =>
        set({ selectedCountry: iso, selectedCountryName: englishName ?? null }),

      setHovered: (iso: string | null) =>
        set({ hoveredCountry: iso }),

      updateNote: (iso: string, note: string) =>
        set((state) => ({
          notes: { ...state.notes, [iso]: note },
        })),

      toggleFlows: () =>
        set((state) => ({ showFlows: !state.showFlows })),

      // ── 자본흐름 CRUD ──

      toggleFlowEditMode: () =>
        set((state) => ({
          flowEditMode: !state.flowEditMode,
          // 편집 모드 종료 시 상태 초기화
          ...(!state.flowEditMode
            ? {
                // ON: 관계선 편집 모드 강제 해제
                relationEditMode: false,
                relationEditBase: null,
                relationPopover: null,
              }
            : { flowEditBase: null, flowPopover: null }),
        })),

      setFlowEditBase: (iso: string | null) =>
        set({ flowEditBase: iso, flowPopover: null }),

      addFlow: (from, to, type, volume, label) =>
        set((state) => {
          const fromCoords = COUNTRY_CENTROIDS[from];
          const toCoords = COUNTRY_CENTROIDS[to];
          if (!fromCoords || !toCoords) return state;
          return {
            capitalFlows: [
              ...state.capitalFlows,
              {
                id: crypto.randomUUID(),
                from_iso: from,
                to_iso: to,
                from_coords: fromCoords,
                to_coords: toCoords,
                volume,
                type,
                label,
              },
            ],
            flowPopover: null,
          };
        }),

      updateFlow: (id, updates) =>
        set((state) => ({
          capitalFlows: state.capitalFlows.map((f) =>
            f.id === id ? { ...f, ...updates } : f,
          ),
          flowPopover: null,
        })),

      removeFlow: (id) =>
        set((state) => ({
          capitalFlows: state.capitalFlows.filter((f) => f.id !== id),
          flowPopover: null,
        })),

      showFlowPopover: (x, y, targetIso) =>
        set({ flowPopover: { x, y, targetIso } }),

      hideFlowPopover: () =>
        set({ flowPopover: null }),

      toggleRanking: () =>
        set((state) => ({
          showRanking: !state.showRanking,
          ...(!state.showRanking ? { showScorecard: false } : {}),
        })),

      toggleScorecard: () =>
        set((state) => ({
          showScorecard: !state.showScorecard,
          ...(!state.showScorecard ? { showRanking: false } : {}),
        })),

      setContinentTag: (iso: string, continent: string) =>
        set((state) => ({
          continentTags: { ...state.continentTags, [iso]: continent },
        })),

      updateCountryEdit: <K extends keyof CountryEditableData>(
        iso: string,
        field: K,
        value: CountryEditableData[K],
      ) =>
        set((state) => ({
          countryEdits: {
            ...state.countryEdits,
            [iso]: { ...state.countryEdits[iso], [field]: value },
          },
        })),

      // ── 7단계: 관계선 액션 ──

      toggleRelations: () =>
        set((state) => ({ showRelations: !state.showRelations })),

      toggleRelationEditMode: () =>
        set((state) => ({
          relationEditMode: !state.relationEditMode,
          // 편집 모드 종료 시 기준 국가 및 팝오버 초기화
          ...(!state.relationEditMode
            ? {
                // ON: 자본흐름 편집 모드 강제 해제
                flowEditMode: false,
                flowEditBase: null,
                flowPopover: null,
              }
            : { relationEditBase: null, relationPopover: null }),
        })),

      setRelationEditBase: (iso: string | null) =>
        set({ relationEditBase: iso, relationPopover: null }),

      addRelation: (from: string, to: string, type: RelationType) =>
        set((state) => {
          const id1 = `${from}-${to}`;
          const id2 = `${to}-${from}`;
          // 기존 관계 제거 후 양방향 추가
          const filtered = state.relations.filter(
            (r) => r.id !== id1 && r.id !== id2,
          );
          return {
            relations: [
              ...filtered,
              { id: id1, from_iso: from, to_iso: to, type },
              { id: id2, from_iso: to, to_iso: from, type },
            ],
            relationPopover: null,
          };
        }),

      removeRelation: (id: string) =>
        set((state) => {
          const rel = state.relations.find((r) => r.id === id);
          if (!rel) return state;
          const reverseId = `${rel.to_iso}-${rel.from_iso}`;
          return {
            relations: state.relations.filter(
              (r) => r.id !== id && r.id !== reverseId,
            ),
            relationPopover: null,
          };
        }),

      showRelationPopover: (x: number, y: number, targetIso: string) =>
        set({ relationPopover: { x, y, targetIso } }),

      hideRelationPopover: () =>
        set({ relationPopover: null }),

      // ── 8단계: G2 시뮬레이션 액션 ──

      setActiveTab: (tab) => set({ activeTab: tab }),

      setActiveSuperpower: (code) =>
        set({ activeSuperpower: code, expandedIssueId: null }),

      updateObjective: (code, field, value) =>
        set((state) => ({
          objectives: {
            ...state.objectives,
            [code]: { ...state.objectives[code], [field]: value },
          },
        })),

      setCountryGroup: (superpower, iso, group) =>
        set((state) => {
          const current = { ...state.countryGroupings[superpower] };
          if (group === "unclassified") {
            delete current[iso];
          } else {
            current[iso] = group;
          }
          return {
            countryGroupings: {
              ...state.countryGroupings,
              [superpower]: current,
            },
          };
        }),

      addIssue: (superpower, title) =>
        set((state) => {
          const newIssue: EconomicIssue = {
            id: crypto.randomUUID(),
            title,
            analysis: { ...EMPTY_ANALYSIS },
            relatedCountries: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return {
            issues: {
              ...state.issues,
              [superpower]: [...state.issues[superpower], newIssue],
            },
            expandedIssueId: newIssue.id,
            issueBarExpanded: true,
          };
        }),

      updateIssue: (superpower, issueId, updates) =>
        set((state) => ({
          issues: {
            ...state.issues,
            [superpower]: state.issues[superpower].map((issue) =>
              issue.id === issueId
                ? { ...issue, ...updates, updatedAt: Date.now() }
                : issue,
            ),
          },
        })),

      removeIssue: (superpower, issueId) =>
        set((state) => ({
          issues: {
            ...state.issues,
            [superpower]: state.issues[superpower].filter(
              (i) => i.id !== issueId,
            ),
          },
          expandedIssueId:
            state.expandedIssueId === issueId ? null : state.expandedIssueId,
        })),

      setExpandedIssue: (id) => set({ expandedIssueId: id }),

      toggleIssueBar: () =>
        set((state) => ({ issueBarExpanded: !state.issueBarExpanded })),
    }),
    {
      name: "gordon-macro-map",
      partialize: (state) => ({
        notes: state.notes,
        continentTags: state.continentTags,
        countryEdits: state.countryEdits,
        capitalFlows: state.capitalFlows,
        relations: state.relations,
        // 8단계
        objectives: state.objectives,
        countryGroupings: state.countryGroupings,
        issues: state.issues,
      }),
    },
  ),
);
