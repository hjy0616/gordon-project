import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Simulation,
  StepData,
  CrowdAnalysis,
  MyAnalysis,
  SimFlowNode,
  SimFlowEdge,
  PanelMode,
  MainView,
} from "@/types/lasagna";
import { createEmptySimulation } from "@/types/lasagna";
import { syncToServer } from "@/lib/api-sync";

const API = "/api/lasagna/simulations";

function updateSim(
  simulations: Simulation[],
  simId: string,
  updater: (sim: Simulation) => Partial<Simulation>,
): Simulation[] {
  return simulations.map((sim) =>
    sim.id === simId
      ? { ...sim, ...updater(sim), updatedAt: new Date().toISOString() }
      : sim,
  );
}

interface LasagnaState {
  simulations: Simulation[];
  selectedSimulationId: string | null;
  panelMode: PanelMode;
  mainView: MainView;
}

interface LasagnaActions {
  createSimulation: (
    title: string,
    eventType: string,
    eventDescription: string,
  ) => void;
  deleteSimulation: (id: string) => void;
  selectSimulation: (id: string | null) => void;
  updateStep: (simId: string, stepNum: number, data: Partial<StepData>) => void;
  advanceStep: (simId: string) => void;
  goToStep: (simId: string, stepNum: number) => void;
  updateCrowdAnalysis: (
    simId: string,
    data: Partial<CrowdAnalysis>,
  ) => void;
  updateMyAnalysis: (simId: string, data: Partial<MyAnalysis>) => void;
  updateFlowNodes: (simId: string, nodes: SimFlowNode[]) => void;
  updateFlowEdges: (simId: string, edges: SimFlowEdge[]) => void;
  completeSimulation: (simId: string) => void;
  setPanelMode: (mode: PanelMode) => void;
  setMainView: (view: MainView) => void;
}

export const useLasagnaStore = create<LasagnaState & LasagnaActions>()(
  persist(
    (set, get) => ({
      simulations: [],
      selectedSimulationId: null,
      panelMode: "list",
      mainView: "stepper",

      createSimulation: (title, eventType, eventDescription) => {
        const sim = createEmptySimulation(title, eventType, eventDescription);
        set((state) => ({
          simulations: [sim, ...state.simulations],
          selectedSimulationId: sim.id,
          panelMode: "list",
          mainView: "stepper",
        }));
        syncToServer(API, "POST", sim);
      },

      deleteSimulation: (id) => {
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id),
          selectedSimulationId:
            state.selectedSimulationId === id
              ? null
              : state.selectedSimulationId,
        }));
        syncToServer(API, "DELETE", { id });
      },

      selectSimulation: (id) =>
        set({ selectedSimulationId: id }),

      updateStep: (simId, stepNum, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            steps: {
              ...sim.steps,
              [stepNum]: { ...sim.steps[stepNum], ...data },
            },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim) syncToServer(API, "PUT", { id: simId, steps: sim.steps });
      },

      advanceStep: (simId) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            currentStep: Math.min(sim.currentStep + 1, 8),
            steps: {
              ...sim.steps,
              [sim.currentStep]: {
                ...sim.steps[sim.currentStep],
                completed: true,
              },
            },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim)
          syncToServer(API, "PUT", {
            id: simId,
            currentStep: sim.currentStep,
            steps: sim.steps,
          });
      },

      goToStep: (simId, stepNum) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            currentStep: stepNum,
          })),
        }));
        syncToServer(API, "PUT", { id: simId, currentStep: stepNum });
      },

      updateCrowdAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            crowdAnalysis: { ...sim.crowdAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim)
          syncToServer(API, "PUT", {
            id: simId,
            crowdAnalysis: sim.crowdAnalysis,
          });
      },

      updateMyAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            myAnalysis: { ...sim.myAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim)
          syncToServer(API, "PUT", { id: simId, myAnalysis: sim.myAnalysis });
      },

      updateFlowNodes: (simId, nodes) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowNodes: nodes,
          })),
        }));
        syncToServer(API, "PUT", { id: simId, flowNodes: nodes });
      },

      updateFlowEdges: (simId, edges) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowEdges: edges,
          })),
        }));
        syncToServer(API, "PUT", { id: simId, flowEdges: edges });
      },

      completeSimulation: (simId) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            status: "completed",
          })),
          mainView: "summary" as MainView,
        }));
        syncToServer(API, "PUT", { id: simId, status: "completed" });
      },

      setPanelMode: (mode) => set({ panelMode: mode }),

      setMainView: (view) => set({ mainView: view }),
    }),
    {
      name: "lasagna-simulations",
      partialize: (state) => ({
        simulations: state.simulations,
        selectedSimulationId: state.selectedSimulationId,
      }),
    },
  ),
);
