"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [newTag, setNewTag] = useState("");

  const presetTags = DOMAIN_TAGS as readonly string[];
  const customTags = selectedDomains.filter((d) => !presetTags.includes(d));

  function toggleDomain(tag: string) {
    const next = selectedDomains.includes(tag)
      ? selectedDomains.filter((d) => d !== tag)
      : [...selectedDomains, tag];
    updateStep(simulation.id, 1, { domains: next });
  }

  function addCustomTag() {
    const tag = newTag.trim();
    if (!tag || selectedDomains.includes(tag)) return;
    updateStep(simulation.id, 1, { domains: [...selectedDomains, tag] });
    setNewTag("");
  }

  function removeCustomTag(tag: string) {
    updateStep(simulation.id, 1, {
      domains: selectedDomains.filter((d) => d !== tag),
    });
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
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeCustomTag(tag)}
                className="rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="커스텀 태그 입력..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            className="h-8 flex-1 text-xs"
          />
          <button
            type="button"
            onClick={addCustomTag}
            disabled={!newTag.trim()}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-primary/50 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
          >
            <Plus className="size-3" />
            추가
          </button>
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
