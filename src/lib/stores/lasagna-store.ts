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

// 신규 sim의 POST 응답을 같은 id의 PUT/DELETE가 await할 수 있게 보관.
// fire-and-forget POST 직후 사용자 입력으로 발사되는 PUT이 server row보다 먼저 도착해
// updateMany 0-row → "[sync] PUT ... updated 0 rows" 경고가 뜨던 race를 막는다.
// .finally로 항상 정리되며, POST 실패 시에도 Map에서 제거된다 (그 경우 후속 PUT은
// 그대로 발사되어 진짜 mismatch 신호로 0-row warn이 다시 뜬다 — 의도된 동작).
const pendingCreates = new Map<string, Promise<Response | null>>();

async function syncMutation(
  id: string,
  body: unknown,
  method: "PUT" | "DELETE",
): Promise<Response | null> {
  const pending = pendingCreates.get(id);
  if (pending) await pending;
  return syncToServer(API, method, body);
}

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
        const post = syncToServer(API, "POST", sim);
        pendingCreates.set(sim.id, post);
        post.finally(() => pendingCreates.delete(sim.id));
      },

      deleteSimulation: (id) => {
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id),
          selectedSimulationId:
            state.selectedSimulationId === id
              ? null
              : state.selectedSimulationId,
        }));
        syncMutation(id, { id }, "DELETE");
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
        if (sim) syncMutation(simId, { id: simId, steps: sim.steps }, "PUT");
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
          syncMutation(
            simId,
            {
              id: simId,
              currentStep: sim.currentStep,
              steps: sim.steps,
            },
            "PUT",
          );
      },

      goToStep: (simId, stepNum) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            currentStep: stepNum,
          })),
        }));
        syncMutation(simId, { id: simId, currentStep: stepNum }, "PUT");
      },

      updateCrowdAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            crowdAnalysis: { ...sim.crowdAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim)
          syncMutation(
            simId,
            {
              id: simId,
              crowdAnalysis: sim.crowdAnalysis,
            },
            "PUT",
          );
      },

      updateMyAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            myAnalysis: { ...sim.myAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim)
          syncMutation(simId, { id: simId, myAnalysis: sim.myAnalysis }, "PUT");
      },

      updateFlowNodes: (simId, nodes) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowNodes: nodes,
          })),
        }));
        syncMutation(simId, { id: simId, flowNodes: nodes }, "PUT");
      },

      updateFlowEdges: (simId, edges) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowEdges: edges,
          })),
        }));
        syncMutation(simId, { id: simId, flowEdges: edges }, "PUT");
      },

      completeSimulation: (simId) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            status: "completed",
          })),
          mainView: "summary" as MainView,
        }));
        syncMutation(simId, { id: simId, status: "completed" }, "PUT");
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
