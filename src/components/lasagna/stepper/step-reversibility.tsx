"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation, ReversibilityLevel } from "@/types/lasagna";

interface StepReversibilityProps {
  simulation: Simulation;
}

const REVERSIBILITY_OPTIONS: {
  value: ReversibilityLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "reversible",
    title: "가역적",
    description: "시간이 지나면 원래 상태로 돌아올 수 있는 변화",
  },
  {
    value: "partially_reversible",
    title: "부분 가역",
    description: "일부는 복구 가능하나 구조적 손상이 남을 수 있음",
  },
  {
    value: "irreversible",
    title: "비가역적",
    description: "되돌릴 수 없는 구조적 변화, 새로운 균형점으로 이동",
  },
];

export function StepReversibility({ simulation }: StepReversibilityProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[7];
  const reversibility = stepData?.reversibility ?? "";
  const reversibilityReason = stepData?.reversibilityReason ?? "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">되돌림 가능성 판단</Label>
        <RadioGroup
          value={reversibility}
          onValueChange={(value) =>
            updateStep(simulation.id, 7, {
              reversibility: value as ReversibilityLevel,
            })
          }
          className="space-y-2"
        >
          {REVERSIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <RadioGroupItem value={opt.value} className="mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{opt.title}</p>
                <p className="text-xs text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reversibility-reason" className="text-sm font-medium">
          판단 근거
        </Label>
        <Textarea
          id="reversibility-reason"
          placeholder="왜 이 수준의 가역성이라고 판단했는지..."
          value={reversibilityReason}
          onChange={(e) =>
            updateStep(simulation.id, 7, {
              reversibilityReason: e.target.value,
            })
          }
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
