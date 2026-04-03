import { create } from "zustand";
import type {
  MacroMapState,
  MacroMapActions,
  IndicatorType,
  CountryEditableData,
  RelationType,
  EditTab,
  LineStyle,
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
    showRanking: false,
    showScorecard: false,
    continentTags: {},
    countryEdits: {},
    // 관계선
    relations: MOCK_RELATIONS,
    showRelations: false,
    // 통합 편집 모드
    editMode: false,
    editBase: null,
    editPopover: null,

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

    addFlow: (from, to, type, volume, label, color, lineStyle) =>
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
          color,
          lineStyle,
        };
        syncToServer("/api/macro-map/flows", "POST", flow);
        return {
          capitalFlows: [...state.capitalFlows, flow],
          editPopover: null,
        };
      }),

    updateFlow: (id, updates) => {
      set((state) => ({
        capitalFlows: state.capitalFlows.map((f) =>
          f.id === id ? { ...f, ...updates } : f,
        ),
        editPopover: null,
      }));
      syncToServer("/api/macro-map/flows", "PUT", { id, ...updates });
    },

    removeFlow: (id) => {
      set((state) => ({
        capitalFlows: state.capitalFlows.filter((f) => f.id !== id),
        editPopover: null,
      }));
      syncToServer("/api/macro-map/flows", "DELETE", { id });
    },

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
      const state = useMacroMapStore.getState();
      const edit = state.countryEdits[iso];
      if (edit) {
        syncToServer("/api/macro-map/country-edits", "PUT", {
          isoA3: iso,
          ...edit,
        });
      }
    },

    // ── 관계선 액션 ──

    toggleRelations: () =>
      set((state) => ({ showRelations: !state.showRelations })),

    addRelation: (from: string, to: string, type: RelationType, color: string, lineStyle: LineStyle) => {
      set((state) => {
        const id1 = `${from}-${to}`;
        const id2 = `${to}-${from}`;
        const filtered = state.relations.filter(
          (r) => r.id !== id1 && r.id !== id2,
        );
        return {
          relations: [
            ...filtered,
            { id: id1, from_iso: from, to_iso: to, type, color, lineStyle },
            { id: id2, from_iso: to, to_iso: from, type, color, lineStyle },
          ],
          editPopover: null,
        };
      });
      syncToServer("/api/macro-map/relations", "POST", {
        from_iso: from,
        to_iso: to,
        type,
        color,
        lineStyle,
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
        editPopover: null,
      });
      syncToServer("/api/macro-map/relations", "DELETE", {
        from_iso: rel.from_iso,
        to_iso: rel.to_iso,
      });
    },

    // ── 통합 편집 모드 ──

    toggleEditMode: () =>
      set((state) => ({
        editMode: !state.editMode,
        ...(!state.editMode ? {} : { editBase: null, editPopover: null }),
      })),

    setEditBase: (iso: string | null) =>
      set({ editBase: iso, editPopover: null }),

    showEditPopover: (x: number, y: number, targetIso: string, activeTab: EditTab) =>
      set({ editPopover: { x, y, targetIso, activeTab } }),

    hideEditPopover: () =>
      set({ editPopover: null }),

    setEditTab: (tab: EditTab) =>
      set((state) =>
        state.editPopover
          ? { editPopover: { ...state.editPopover, activeTab: tab } }
          : {},
      ),
  }),
);
