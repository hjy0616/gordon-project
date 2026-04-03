"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { AMPLIFIER_OPTIONS } from "@/types/lasagna";
import type { Simulation } from "@/types/lasagna";

interface StepAmplifierProps {
  simulation: Simulation;
}

export function StepAmplifier({ simulation }: StepAmplifierProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[3];
  const selectedAmplifiers = stepData?.amplifiers ?? [];
  const amplifierNotes = stepData?.amplifierNotes ?? "";

  function toggleAmplifier(key: string) {
    const next = selectedAmplifiers.includes(key)
      ? selectedAmplifiers.filter((a) => a !== key)
      : [...selectedAmplifiers, key];
    updateStep(simulation.id, 3, { amplifiers: next });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">증폭 요소 선택</Label>
        <div className="space-y-2">
          {AMPLIFIER_OPTIONS.map((opt) => {
            const isChecked = selectedAmplifiers.includes(opt.key);
            return (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => toggleAmplifier(opt.key)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amplifier-notes" className="text-sm font-medium">
          메모
        </Label>
        <Textarea
          id="amplifier-notes"
          placeholder="증폭 요소에 대한 구체적 관찰..."
          value={amplifierNotes}
          onChange={(e) =>
            updateStep(simulation.id, 3, { amplifierNotes: e.target.value })
          }
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
