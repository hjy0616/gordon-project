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
    (set) => ({
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
      },

      deleteSimulation: (id) =>
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id),
          selectedSimulationId:
            state.selectedSimulationId === id
              ? null
              : state.selectedSimulationId,
        })),

      selectSimulation: (id) =>
        set({ selectedSimulationId: id }),

      updateStep: (simId, stepNum, data) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            steps: {
              ...sim.steps,
              [stepNum]: { ...sim.steps[stepNum], ...data },
            },
          })),
        })),

      advanceStep: (simId) =>
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
        })),

      goToStep: (simId, stepNum) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            currentStep: stepNum,
          })),
        })),

      updateCrowdAnalysis: (simId, data) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            crowdAnalysis: { ...sim.crowdAnalysis, ...data },
          })),
        })),

      updateMyAnalysis: (simId, data) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            myAnalysis: { ...sim.myAnalysis, ...data },
          })),
        })),

      updateFlowNodes: (simId, nodes) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowNodes: nodes,
          })),
        })),

      updateFlowEdges: (simId, edges) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowEdges: edges,
          })),
        })),

      completeSimulation: (simId) =>
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            status: "completed",
          })),
          mainView: "summary" as MainView,
        })),

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
