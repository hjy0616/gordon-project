import { create } from "zustand";
import { persist } from "zustand/middleware";
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

  // Create draft (ephemeral, not persisted)
  createDraft: {
    lat: number;
    lng: number;
    region: string;
    searchQuery: string;
  } | null;
}

interface TreasureMapActions {
  selectDistrict: (id: string | null) => void;
  setHoveredDistrict: (id: string | null) => void;
  setMainTab: (tab: MainTabType) => void;
  setRightsSubTab: (tab: RightsSubTabType) => void;
  setAdoptionRate: (rate: number) => void;
  updateDistrictNote: (districtId: string, note: string) => void;

  // Per-district edit actions
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

  // CRUD actions
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

  // UI
  setPanelMode: (mode: PanelMode) => void;

  // Create draft
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

export const useTreasureMapStore = create<
  TreasureMapState & TreasureMapActions
>()(
  persist(
    (set) => ({
      selectedDistrict: null,
      hoveredDistrict: null,
      activeMainTab: "overview",
      activeRightsSubTab: "usage",
      adoptionRate: 50,
      districtNotes: {},
      districtEdits: {},

      // CRUD state
      customDistricts: [],
      districtOverrides: {},
      deletedMockIds: [],
      panelMode: "list",
      createDraft: null,

      selectDistrict: (id) =>
        set({ selectedDistrict: id, panelMode: id ? "view" : "list" }),
      setHoveredDistrict: (id) => set({ hoveredDistrict: id }),
      setMainTab: (tab) => set({ activeMainTab: tab }),
      setRightsSubTab: (tab) => set({ activeRightsSubTab: tab }),
      setAdoptionRate: (rate) => set({ adoptionRate: rate }),

      updateDistrictNote: (districtId, note) =>
        set((state) => ({
          districtNotes: { ...state.districtNotes, [districtId]: note },
        })),

      updateDistrictHaaSScore: (districtId, key, value) =>
        set((state) =>
          updateEdits(state, districtId, (prev) => ({
            ...prev,
            haasScores: { ...prev.haasScores, [key]: value },
          })),
        ),

      updateDistrictRadarScore: (districtId, key, value) =>
        set((state) =>
          updateEdits(state, districtId, (prev) => ({
            ...prev,
            radarScores: { ...prev.radarScores, [key]: value },
          })),
        ),

      updateDistrictUsageInput: (districtId, field, value) =>
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
        ),

      updateDistrictRevenueInput: (districtId, field, value) =>
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
        ),

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
          return {
            customDistricts: [...state.customDistricts, newDistrict],
            selectedDistrict: id,
            panelMode: "view",
          };
        }),

      updateCustomDistrict: (id, updates) =>
        set((state) => ({
          customDistricts: state.customDistricts.map((d) =>
            d.id === id ? { ...d, ...updates } : d,
          ),
        })),

      deleteDistrict: (id) =>
        set((state) => {
          const isCustom = state.customDistricts.some((d) => d.id === id);
          if (isCustom) {
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
            return {
              deletedMockIds: [...state.deletedMockIds, id],
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

      updateMockOverride: (id, overrides) =>
        set((state) => ({
          districtOverrides: {
            ...state.districtOverrides,
            [id]: { ...state.districtOverrides[id], ...overrides },
          },
        })),

      restoreMockDistrict: (id) =>
        set((state) => {
          const nextOverrides = { ...state.districtOverrides };
          delete nextOverrides[id];
          return {
            deletedMockIds: state.deletedMockIds.filter((mid) => mid !== id),
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
        set({ panelMode: mode, ...(mode !== "create" ? { createDraft: null } : {}) }),

      setCreateDraft: (draft) => set({ createDraft: draft }),
      clearCreateDraft: () => set({ createDraft: null }),
    }),
    {
      name: "gordon-treasure-map",
      partialize: (state) => ({
        districtNotes: state.districtNotes,
        districtEdits: state.districtEdits,
        adoptionRate: state.adoptionRate,
        customDistricts: state.customDistricts,
        districtOverrides: state.districtOverrides,
        deletedMockIds: state.deletedMockIds,
      }),
    },
  ),
);
