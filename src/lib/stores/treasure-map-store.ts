import { create } from "zustand";
import type {
  MainTabType,
  RightsSubTabType,
  PanelMode,
  DistrictEdits,
  DistrictOverrides,
  HaaSCriterionKey,
  RevenueScenarioInput,
  CustomDistrict,
} from "@/types/treasure-map";
import {
  DEFAULT_CRITERIA,
  DEFAULT_RIGHTS_DATA,
  DEFAULT_HAAS_SCORES,
} from "@/types/treasure-map";
import { DISTRICT_MAP } from "@/data/mock-korean-districts";
import { syncToServer } from "@/lib/api-sync";

type RadarKey =
  | "iotDensity"
  | "transactionVolume"
  | "uniqueVisitors"
  | "platformEngagement"
  | "dataQuality";

interface TreasureMapState {
  selectedDistrict: string | null;
  hoveredDistrict: string | null;
  activeMainTab: MainTabType;
  activeRightsSubTab: RightsSubTabType;
  adoptionRate: number;
  districtNotes: Record<string, string>;
  districtEdits: Record<string, DistrictEdits>;

  // CRUD state
  customDistricts: CustomDistrict[];
  districtOverrides: Record<string, DistrictOverrides>;
  deletedMockIds: string[];
  panelMode: PanelMode;

  // Create draft (ephemeral)
  createDraft: {
    lat: number;
    lng: number;
    region: string;
    searchQuery: string;
  } | null;

  // Mobile create flow step
  createStep: "locate" | "form" | null;
}

interface TreasureMapActions {
  selectDistrict: (id: string | null) => void;
  setHoveredDistrict: (id: string | null) => void;
  setMainTab: (tab: MainTabType) => void;
  setRightsSubTab: (tab: RightsSubTabType) => void;
  setAdoptionRate: (rate: number) => void;
  updateDistrictNote: (districtId: string, note: string) => void;

  updateDistrictHaaSScore: (
    districtId: string,
    key: HaaSCriterionKey,
    value: number,
  ) => void;
  updateDistrictRadarScore: (
    districtId: string,
    key: RadarKey,
    value: number,
  ) => void;
  updateDistrictUsageInput: (
    districtId: string,
    field: "jeonseDeposit" | "wolseMonthly" | "haasSubscription",
    value: number,
  ) => void;
  updateDistrictRevenueInput: (
    districtId: string,
    field: keyof RevenueScenarioInput,
    value: number,
  ) => void;
  resetDistrictEdits: (districtId: string) => void;

  addCustomDistrict: (
    district: Omit<CustomDistrict, "id" | "isCustom">,
  ) => void;
  updateCustomDistrict: (
    id: string,
    updates: Partial<Omit<CustomDistrict, "id" | "isCustom">>,
  ) => void;
  deleteDistrict: (id: string) => void;
  updateMockOverride: (
    id: string,
    overrides: Partial<DistrictOverrides>,
  ) => void;
  restoreMockDistrict: (id: string) => void;
  resetAllToDefaults: () => void;

  setPanelMode: (mode: PanelMode) => void;
  setCreateStep: (step: "locate" | "form" | null) => void;
  setCreateDraft: (draft: {
    lat: number;
    lng: number;
    region: string;
    searchQuery: string;
  }) => void;
  clearCreateDraft: () => void;
}

function updateEdits(
  state: TreasureMapState,
  districtId: string,
  updater: (prev: DistrictEdits) => DistrictEdits,
): Partial<TreasureMapState> {
  const prev = state.districtEdits[districtId] ?? {};
  return {
    districtEdits: {
      ...state.districtEdits,
      [districtId]: updater(prev),
    },
  };
}

function syncDistrictEdits(districtId: string) {
  const state = useTreasureMapStore.getState();
  const edit = state.districtEdits[districtId];
  if (edit) {
    syncToServer("/api/treasure-map/edits", "PUT", {
      districtId,
      ...edit,
    });
  }
}

export const useTreasureMapStore = create<
  TreasureMapState & TreasureMapActions
>()(
  (set) => ({
    selectedDistrict: null,
    hoveredDistrict: null,
    activeMainTab: "overview",
    activeRightsSubTab: "usage",
    adoptionRate: 50,
    districtNotes: {},
    districtEdits: {},

    customDistricts: [],
    districtOverrides: {},
    deletedMockIds: [],
    panelMode: "list",
    createDraft: null,
    createStep: null,

    selectDistrict: (id) =>
      set({ selectedDistrict: id, panelMode: id ? "view" : "list" }),
    setHoveredDistrict: (id) => set({ hoveredDistrict: id }),
    setMainTab: (tab) => set({ activeMainTab: tab }),
    setRightsSubTab: (tab) => set({ activeRightsSubTab: tab }),

    setAdoptionRate: (rate) => {
      set({ adoptionRate: rate });
      syncToServer("/api/treasure-map/preferences", "PUT", {
        adoptionRate: rate,
      });
    },

    updateDistrictNote: (districtId, note) => {
      set((state) => ({
        districtNotes: { ...state.districtNotes, [districtId]: note },
      }));
      syncToServer("/api/treasure-map/notes", "PUT", { districtId, note });
    },

    updateDistrictHaaSScore: (districtId, key, value) => {
      set((state) =>
        updateEdits(state, districtId, (prev) => ({
          ...prev,
          haasScores: { ...prev.haasScores, [key]: value },
        })),
      );
      syncDistrictEdits(districtId);
    },

    updateDistrictRadarScore: (districtId, key, value) => {
      set((state) =>
        updateEdits(state, districtId, (prev) => ({
          ...prev,
          radarScores: { ...prev.radarScores, [key]: value },
        })),
      );
      syncDistrictEdits(districtId);
    },

    updateDistrictUsageInput: (districtId, field, value) => {
      set((state) =>
        updateEdits(state, districtId, (prev) => ({
          ...prev,
          usageSimInputs: {
            ...(prev.usageSimInputs ?? {
              jeonseDeposit: 0,
              wolseMonthly: 0,
              haasSubscription: 0,
            }),
            [field]: value,
          },
        })),
      );
      syncDistrictEdits(districtId);
    },

    updateDistrictRevenueInput: (districtId, field, value) => {
      set((state) =>
        updateEdits(state, districtId, (prev) => ({
          ...prev,
          revenueInputs: {
            ...(prev.revenueInputs ?? {
              holdingYears: 10,
              tokenRatio: 40,
              annualAppreciation: 5,
            }),
            [field]: value,
          },
        })),
      );
      syncDistrictEdits(districtId);
    },

    resetDistrictEdits: (districtId) =>
      set((state) => {
        const next = { ...state.districtEdits };
        delete next[districtId];
        return { districtEdits: next };
      }),

    // ── CRUD actions ──

    addCustomDistrict: (district) =>
      set((state) => {
        const id = crypto.randomUUID();
        const newDistrict: CustomDistrict = {
          ...district,
          id,
          isCustom: true,
          criteria: district.criteria ?? DEFAULT_CRITERIA,
          rightsData: district.rightsData ?? DEFAULT_RIGHTS_DATA,
          haasScores: district.haasScores ?? DEFAULT_HAAS_SCORES,
        };
        syncToServer("/api/treasure-map/districts", "POST", {
          name_ko: newDistrict.name_ko,
          name_en: newDistrict.name_en,
          region: newDistrict.region,
          tier: newDistrict.tier,
          tierReason: newDistrict.tierReason,
          lat: newDistrict.lat,
          lng: newDistrict.lng,
          criteria: newDistrict.criteria,
          haasScores: newDistrict.haasScores,
          rightsData: newDistrict.rightsData,
        });
        return {
          customDistricts: [...state.customDistricts, newDistrict],
          selectedDistrict: id,
          panelMode: "view",
          createStep: null,
        };
      }),

    updateCustomDistrict: (id, updates) => {
      set((state) => ({
        customDistricts: state.customDistricts.map((d) =>
          d.id === id ? { ...d, ...updates } : d,
        ),
      }));
      syncToServer("/api/treasure-map/districts", "PUT", { id, ...updates });
    },

    deleteDistrict: (id) =>
      set((state) => {
        const isCustom = state.customDistricts.some((d) => d.id === id);
        if (isCustom) {
          syncToServer("/api/treasure-map/districts", "DELETE", { id });
          return {
            customDistricts: state.customDistricts.filter(
              (d) => d.id !== id,
            ),
            selectedDistrict:
              state.selectedDistrict === id
                ? null
                : state.selectedDistrict,
            panelMode:
              state.selectedDistrict === id ? "list" : state.panelMode,
          };
        }
        // Mock district: soft-delete
        if (DISTRICT_MAP.has(id)) {
          const newDeletedIds = [...state.deletedMockIds, id];
          syncToServer("/api/treasure-map/preferences", "PUT", {
            deletedMockIds: newDeletedIds,
          });
          return {
            deletedMockIds: newDeletedIds,
            selectedDistrict:
              state.selectedDistrict === id
                ? null
                : state.selectedDistrict,
            panelMode:
              state.selectedDistrict === id ? "list" : state.panelMode,
          };
        }
        return {};
      }),

    updateMockOverride: (id, overrides) => {
      set((state) => ({
        districtOverrides: {
          ...state.districtOverrides,
          [id]: { ...state.districtOverrides[id], ...overrides },
        },
      }));
      syncToServer("/api/treasure-map/overrides", "PUT", {
        districtId: id,
        ...overrides,
      });
    },

    restoreMockDistrict: (id) =>
      set((state) => {
        const nextOverrides = { ...state.districtOverrides };
        delete nextOverrides[id];
        const newDeletedIds = state.deletedMockIds.filter(
          (mid) => mid !== id,
        );
        syncToServer("/api/treasure-map/preferences", "PUT", {
          deletedMockIds: newDeletedIds,
        });
        syncToServer("/api/treasure-map/overrides", "DELETE", {
          districtId: id,
        });
        return {
          deletedMockIds: newDeletedIds,
          districtOverrides: nextOverrides,
        };
      }),

    resetAllToDefaults: () =>
      set({
        customDistricts: [],
        districtOverrides: {},
        deletedMockIds: [],
        districtEdits: {},
        districtNotes: {},
        selectedDistrict: null,
        panelMode: "list",
      }),

    setPanelMode: (mode) =>
      set({
        panelMode: mode,
        ...(mode === "create"
          ? { createStep: "locate" as const }
          : { createDraft: null, createStep: null }),
      }),

    setCreateStep: (step) => set({ createStep: step }),
    setCreateDraft: (draft) => set({ createDraft: draft }),
    clearCreateDraft: () => set({ createDraft: null, createStep: null }),
  }),
);
