import { create } from "zustand";
import type {
  MacroMapState,
  MacroMapActions,
  IndicatorType,
  CountryEditableData,
  RelationType,
} from "@/types/macro-map";
import { MOCK_RELATIONS } from "@/data/mock-relations";
import { COUNTRY_CENTROIDS } from "@/data/country-centroids";
import { syncToServer } from "@/lib/api-sync";

export const useMacroMapStore = create<MacroMapState & MacroMapActions>()(
  (set) => ({
    activeIndicator: "gdp_growth",
    selectedCountry: null,
    selectedCountryName: null,
    hoveredCountry: null,
    hoverPos: null,
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
    setIndicator: (indicator: IndicatorType) =>
      set({ activeIndicator: indicator }),

    selectCountry: (iso: string | null, englishName?: string) =>
      set({ selectedCountry: iso, selectedCountryName: englishName ?? null }),

    setHovered: (iso: string | null, pos?: { x: number; y: number }) =>
      set({ hoveredCountry: iso, hoverPos: pos ?? null }),

    updateNote: (iso: string, note: string) => {
      set((state) => ({
        notes: { ...state.notes, [iso]: note },
      }));
      syncToServer("/api/macro-map/notes", "PUT", { isoA3: iso, note });
    },

    toggleFlows: () =>
      set((state) => ({ showFlows: !state.showFlows })),

    // ── 자본흐름 CRUD ──

    toggleFlowEditMode: () =>
      set((state) => ({
        flowEditMode: !state.flowEditMode,
        ...(!state.flowEditMode
          ? {
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
        const id = crypto.randomUUID();
        const flow = {
          id,
          from_iso: from,
          to_iso: to,
          from_coords: fromCoords,
          to_coords: toCoords,
          volume,
          type,
          label,
        };
        syncToServer("/api/macro-map/flows", "POST", flow);
        return {
          capitalFlows: [...state.capitalFlows, flow],
          flowPopover: null,
        };
      }),

    updateFlow: (id, updates) => {
      set((state) => ({
        capitalFlows: state.capitalFlows.map((f) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
        flowPopover: null,
      }));
      syncToServer("/api/macro-map/flows", "PUT", { id, ...updates });
    },

    removeFlow: (id) => {
      set((state) => ({
        capitalFlows: state.capitalFlows.filter((f) => f.id !== id),
        flowPopover: null,
      }));
      syncToServer("/api/macro-map/flows", "DELETE", { id });
    },

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

    setContinentTag: (iso: string, continent: string) => {
      set((state) => ({
        continentTags: { ...state.continentTags, [iso]: continent },
      }));
      syncToServer("/api/macro-map/notes", "PUT", {
        isoA3: iso,
        continentTag: continent,
      });
    },

    updateCountryEdit: <K extends keyof CountryEditableData>(
      iso: string,
      field: K,
      value: CountryEditableData[K],
    ) => {
      set((state) => ({
        countryEdits: {
          ...state.countryEdits,
          [iso]: { ...state.countryEdits[iso], [field]: value },
        },
      }));
      // debounce는 컴포넌트 쪽에서 이미 처리 중
      const state = useMacroMapStore.getState();
      const edit = state.countryEdits[iso];
      if (edit) {
        syncToServer("/api/macro-map/country-edits", "PUT", {
          isoA3: iso,
          ...edit,
        });
      }
    },

    // ── 7단계: 관계선 액션 ──

    toggleRelations: () =>
      set((state) => ({ showRelations: !state.showRelations })),

    toggleRelationEditMode: () =>
      set((state) => ({
        relationEditMode: !state.relationEditMode,
        ...(!state.relationEditMode
          ? {
              flowEditMode: false,
              flowEditBase: null,
              flowPopover: null,
            }
          : { relationEditBase: null, relationPopover: null }),
      })),

    setRelationEditBase: (iso: string | null) =>
      set({ relationEditBase: iso, relationPopover: null }),

    addRelation: (from: string, to: string, type: RelationType) => {
      set((state) => {
        const id1 = `${from}-${to}`;
        const id2 = `${to}-${from}`;
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
      });
      syncToServer("/api/macro-map/relations", "POST", {
        from_iso: from,
        to_iso: to,
        type,
      });
    },

    removeRelation: (id: string) => {
      const state = useMacroMapStore.getState();
      const rel = state.relations.find((r) => r.id === id);
      if (!rel) return;
      const reverseId = `${rel.to_iso}-${rel.from_iso}`;
      set({
        relations: state.relations.filter(
          (r) => r.id !== id && r.id !== reverseId,
        ),
        relationPopover: null,
      });
      syncToServer("/api/macro-map/relations", "DELETE", {
        from_iso: rel.from_iso,
        to_iso: rel.to_iso,
      });
    },

    showRelationPopover: (x: number, y: number, targetIso: string) =>
      set({ relationPopover: { x, y, targetIso } }),

    hideRelationPopover: () =>
      set({ relationPopover: null }),
  }),
);
