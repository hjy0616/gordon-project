"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";

interface StepCauseProps {
  simulation: Simulation;
}

export function StepCause({ simulation }: StepCauseProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[2];
  const surfaceCause = stepData?.surfaceCause ?? "";
  const rootCause = stepData?.rootCause ?? "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="surface-cause" className="text-sm font-medium">
          표면적 현상
        </Label>
        <p className="text-xs text-muted-foreground">
          뉴스 헤드라인에 보이는 현상, 시장이 반응하는 직접적 원인
        </p>
        <Textarea
          id="surface-cause"
          placeholder="예: 미국 CPI 예상치 상회, SVB 뱅크런..."
          value={surfaceCause}
          onChange={(e) =>
            updateStep(simulation.id, 2, { surfaceCause: e.target.value })
          }
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="root-cause" className="text-sm font-medium">
          근본 원인
        </Label>
        <p className="text-xs text-muted-foreground">
          표면 아래 숨겨진 구조적 원인, 시스템적 취약점
        </p>
        <Textarea
          id="root-cause"
          placeholder="예: 장기간 저금리로 인한 듀레이션 미스매치..."
          value={rootCause}
          onChange={(e) =>
            updateStep(simulation.id, 2, { rootCause: e.target.value })
          }
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
