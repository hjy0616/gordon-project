"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";

interface CrowdPanelProps {
  simulation: Simulation;
}

export function CrowdPanel({ simulation }: CrowdPanelProps) {
  const updateCrowdAnalysis = useLasagnaStore((s) => s.updateCrowdAnalysis);
  const { crowdAnalysis } = simulation;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <h3 className="mb-4 text-sm font-semibold text-red-400">대중 반응</h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-red-400/80">대중의 감정</Label>
          <Textarea
            value={crowdAnalysis.emotion}
            onChange={(e) =>
              updateCrowdAnalysis(simulation.id, { emotion: e.target.value })
            }
            placeholder="공포, 탐욕, 분노, FOMO..."
            className="min-h-[80px] border-red-500/20 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-red-400/80">대중의 행동</Label>
          <Textarea
            value={crowdAnalysis.action}
            onChange={(e) =>
              updateCrowdAnalysis(simulation.id, { action: e.target.value })
            }
            placeholder="패닉 셀링, 추격 매수..."
            className="min-h-[80px] border-red-500/20 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-red-400/80">대중의 내러티브</Label>
          <Textarea
            value={crowdAnalysis.narrative}
            onChange={(e) =>
              updateCrowdAnalysis(simulation.id, { narrative: e.target.value })
            }
            placeholder="시장은 끝났다..."
            className="min-h-[80px] border-red-500/20 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
