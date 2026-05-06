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

// hydrate가 서버 응답으로 local을 덮어쓸 때, 아직 POST가 끝나지 않은 신규 sim은
// 서버가 모르므로 보존하기 위해 노출.
export function hasPendingCreate(id: string): boolean {
  return pendingCreates.has(id);
}

// PUT 디바운스/코알레스 레이어. 8개 PUT 액션이 매 keystroke / 매 xyflow change마다
// 즉시 PUT을 발사하던 것을 800ms 윈도우로 묶어 단일 요청으로 발사한다.
// partial body는 키 단위 last-write-wins로 병합되며, 다른 키는 공존(예: { steps,
// currentStep }). 서버 PUT은 partial-merge updateMany라 다중 키 body 정상 처리.
const DEBOUNCE_MS = 800;

type PendingPayload = Record<string, unknown>;
const pendingPayloads = new Map<string, PendingPayload>();
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const inFlightPuts = new Map<string, Promise<unknown>>();

function flushPending(id: string): void {
  const timer = debounceTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(id);
  }

  const payload = pendingPayloads.get(id);
  if (!payload || Object.keys(payload).length === 0) return;
  pendingPayloads.delete(id);

  // 동시 PUT 1개 제한: inflight 있으면 그 뒤에 chain. chain 끝에서 누적분 재flush.
  const prior = inFlightPuts.get(id) ?? Promise.resolve();
  const next = prior
    .catch(() => {
      /* prior 실패는 syncMutation/syncToServer 내부에서 처리됨. chain 끊지 말 것. */
    })
    .then(() => syncMutation(id, { id, ...payload }, "PUT"))
    .finally(() => {
      if (inFlightPuts.get(id) === next) inFlightPuts.delete(id);
      // chain 중 새로 누적된 변경은 즉시 재flush (이미 직전 윈도우를 기다린 상태).
      if (pendingPayloads.has(id)) flushPending(id);
    });

  inFlightPuts.set(id, next);
}

function scheduleSync(id: string, partial: PendingPayload): void {
  const merged = { ...(pendingPayloads.get(id) ?? {}), ...partial };
  pendingPayloads.set(id, merged);

  const existing = debounceTimers.get(id);
  if (existing) clearTimeout(existing);
  debounceTimers.set(id, setTimeout(() => flushPending(id), DEBOUNCE_MS));
}

// 탭 숨김/이동 시 pending PUT 즉시 발사. 모듈 로드 시 1회 등록.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    // pendingPayloads는 flushPending 안에서 mutate되므로 keys() 스냅샷 필요.
    for (const id of Array.from(pendingPayloads.keys())) {
      flushPending(id);
    }
  });
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
        // post는 이미 Map에 등록됐으므로 .finally() 반환 Promise는 cleanup 전용. void로 의도 명시.
        void post.finally(() => pendingCreates.delete(sim.id));
      },

      deleteSimulation: (id) => {
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id),
          selectedSimulationId:
            state.selectedSimulationId === id
              ? null
              : state.selectedSimulationId,
        }));

        // 디바운스 중이던 PUT 취소. 안 그러면 DELETE 후 stale PUT이 0-row warn을 찍는다.
        // 이미 발사된 inFlightPuts는 취소 불가지만, .finally의 pendingPayloads.has(id)
        // 체크가 빈 상태를 보고 재flush 안 하므로 안전.
        const t = debounceTimers.get(id);
        if (t) {
          clearTimeout(t);
          debounceTimers.delete(id);
        }
        pendingPayloads.delete(id);

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
        if (sim) scheduleSync(simId, { steps: sim.steps });
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
          scheduleSync(simId, {
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
        scheduleSync(simId, { currentStep: stepNum });
      },

      updateCrowdAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            crowdAnalysis: { ...sim.crowdAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim) scheduleSync(simId, { crowdAnalysis: sim.crowdAnalysis });
      },

      updateMyAnalysis: (simId, data) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, (sim) => ({
            myAnalysis: { ...sim.myAnalysis, ...data },
          })),
        }));
        const sim = get().simulations.find((s) => s.id === simId);
        if (sim) scheduleSync(simId, { myAnalysis: sim.myAnalysis });
      },

      updateFlowNodes: (simId, nodes) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowNodes: nodes,
          })),
        }));
        scheduleSync(simId, { flowNodes: nodes });
      },

      updateFlowEdges: (simId, edges) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            flowEdges: edges,
          })),
        }));
        scheduleSync(simId, { flowEdges: edges });
      },

      completeSimulation: (simId) => {
        set((state) => ({
          simulations: updateSim(state.simulations, simId, () => ({
            status: "completed",
          })),
          mainView: "summary" as MainView,
        }));
        scheduleSync(simId, { status: "completed" });
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
