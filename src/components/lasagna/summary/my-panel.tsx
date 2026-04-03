"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";

interface MyPanelProps {
  simulation: Simulation;
}

export function MyPanel({ simulation }: MyPanelProps) {
  const updateMyAnalysis = useLasagnaStore((s) => s.updateMyAnalysis);
  const { myAnalysis } = simulation;

  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
      <h3 className="mb-4 text-sm font-semibold text-green-400">
        나의 구조적 분석
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-green-400/80">내가 본 구조</Label>
          <Textarea
            value={myAnalysis.structure}
            onChange={(e) =>
              updateMyAnalysis(simulation.id, { structure: e.target.value })
            }
            placeholder="유동성 축소 → 자산 재배치 구간..."
            className="min-h-[80px] border-green-500/20 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-green-400/80">나의 행동 결정</Label>
          <Textarea
            value={myAnalysis.action}
            onChange={(e) =>
              updateMyAnalysis(simulation.id, { action: e.target.value })
            }
            placeholder="관망, 30% 현금 확보..."
            className="min-h-[80px] border-green-500/20 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-green-400/80">구조적 근거</Label>
          <Textarea
            value={myAnalysis.reason}
            onChange={(e) =>
              updateMyAnalysis(simulation.id, { reason: e.target.value })
            }
            placeholder="Step 7 판단: 가역적 정책이므로..."
            className="min-h-[80px] border-green-500/20 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
