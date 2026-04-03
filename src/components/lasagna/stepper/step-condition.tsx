"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import type { Simulation } from "@/types/lasagna";
import { cn } from "@/lib/utils";

interface StepConditionProps {
  simulation: Simulation;
}

export function StepCondition({ simulation }: StepConditionProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[5];
  const hasChanges = stepData?.hasChanges;
  const conditionNotes = stepData?.conditionNotes ?? "";

  function setHasChanges(value: boolean) {
    updateStep(simulation.id, 5, { hasChanges: value });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">조건 변화 여부</Label>
        <div className="flex gap-2">
          {[
            { value: true, label: "변화 감지됨" },
            { value: false, label: "변화 없음" },
          ].map((opt) => {
            const isSelected = hasChanges === opt.value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setHasChanges(opt.value)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition-notes" className="text-sm font-medium">
          메모
        </Label>
        <p className="text-xs text-muted-foreground">
          계약 기간 / 담보 가치 / 규제 환경 / 설명 방식의 변화를 점검하세요
        </p>
        <Textarea
          id="condition-notes"
          placeholder="어떤 조건이 변했는지 구체적으로 기술..."
          value={conditionNotes}
          onChange={(e) =>
            updateStep(simulation.id, 5, { conditionNotes: e.target.value })
          }
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
