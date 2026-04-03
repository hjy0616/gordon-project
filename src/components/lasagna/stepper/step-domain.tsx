"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { DOMAIN_TAGS } from "@/types/lasagna";
import type { Simulation } from "@/types/lasagna";
import { cn } from "@/lib/utils";

interface StepDomainProps {
  simulation: Simulation;
}

export function StepDomain({ simulation }: StepDomainProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[1];
  const selectedDomains = stepData?.domains ?? [];
  const domainNotes = stepData?.domainNotes ?? "";

  function toggleDomain(tag: string) {
    const next = selectedDomains.includes(tag)
      ? selectedDomains.filter((d) => d !== tag)
      : [...selectedDomains, tag];
    updateStep(simulation.id, 1, { domains: next });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">영역 태그 선택</Label>
        <div className="flex flex-wrap gap-2">
          {DOMAIN_TAGS.map((tag) => {
            const isSelected = selectedDomains.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleDomain(tag)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain-notes" className="text-sm font-medium">
          메모
        </Label>
        <Textarea
          id="domain-notes"
          placeholder="이 사건이 왜 해당 영역에 속하는지 간단히 메모..."
          value={domainNotes}
          onChange={(e) =>
            updateStep(simulation.id, 1, { domainNotes: e.target.value })
          }
          className="min-h-[80px] resize-none"
        />
      </div>
    </div>
  );
}
