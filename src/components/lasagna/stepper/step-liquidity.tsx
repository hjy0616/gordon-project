"use client";

import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";
import { FlowCanvas } from "../mindmap/flow-canvas";

interface StepLiquidityProps {
  simulation: Simulation;
}

export function StepLiquidity({ simulation }: StepLiquidityProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);

  const stepData = simulation.steps[6] ?? {};

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        4단계에서 만든 전이 경로 위에 유동성 노드(초록)를 추가하세요. 돈이
        어디서 빠져나와 어디로 가는지 흐름을 시각화합니다.
      </p>

      <div className="h-[380px] overflow-hidden rounded-md border md:h-[420px]">
        <FlowCanvas simulation={simulation} mode="liquidity" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          유동성 방향 메모
        </label>
        <Textarea
          value={stepData.liquidityNotes ?? ""}
          onChange={(e) =>
            updateStep(simulation.id, 6, {
              liquidityNotes: e.target.value,
            })
          }
          placeholder="돈의 흐름 방향과 유동성 변화에 대한 메모..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
