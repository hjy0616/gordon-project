"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { ACTION_OPTIONS } from "@/types/lasagna";
import type { Simulation, ActionDecision } from "@/types/lasagna";
import { cn } from "@/lib/utils";

interface StepActionProps {
  simulation: Simulation;
}

export function StepAction({ simulation }: StepActionProps) {
  const updateStep = useLasagnaStore((s) => s.updateStep);
  const stepData = simulation.steps[8];
  const exclusions = stepData?.exclusions ?? [];
  const action = stepData?.action ?? "";
  const actionNotes = stepData?.actionNotes ?? "";

  const [newExclusion, setNewExclusion] = useState("");

  const phase2Enabled = exclusions.length > 0;

  function addExclusion() {
    const trimmed = newExclusion.trim();
    if (!trimmed) return;
    updateStep(simulation.id, 8, { exclusions: [...exclusions, trimmed] });
    setNewExclusion("");
  }

  function removeExclusion(index: number) {
    const next = exclusions.filter((_, i) => i !== index);
    updateStep(simulation.id, 8, { exclusions: next });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addExclusion();
    }
  }

  return (
    <div className="space-y-4">
      {/* Phase 1: Exclusions */}
      <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <Label className="text-sm font-medium">
          Phase 1: 하지 말 것 (필수)
        </Label>

        {exclusions.length > 0 && (
          <ul className="space-y-1.5">
            {exclusions.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-md border border-destructive/20 bg-background px-3 py-1.5"
              >
                <span className="text-sm">{item}</span>
                <button
                  type="button"
                  onClick={() => removeExclusion(idx)}
                  className="ml-2 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="하지 말아야 할 것을 입력..."
            value={newExclusion}
            onChange={(e) => setNewExclusion(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addExclusion}
            disabled={!newExclusion.trim()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Phase 2: Action Decision */}
      <div
        className={cn(
          "space-y-3 rounded-md border p-3 transition-opacity",
          phase2Enabled
            ? "border-green-500/30 bg-green-500/5"
            : "pointer-events-none opacity-40 border-border",
        )}
      >
        <Label className="text-sm font-medium">
          Phase 2: 행동 결정
          {!phase2Enabled && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Phase 1을 먼저 완성하세요)
            </span>
          )}
        </Label>

        <RadioGroup
          value={action}
          onValueChange={(value) =>
            updateStep(simulation.id, 8, { action: value as ActionDecision })
          }
          className="space-y-2"
        >
          {ACTION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <RadioGroupItem value={opt.value} />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>

        <div className="space-y-2">
          <Label htmlFor="action-notes" className="text-sm font-medium">
            메모
          </Label>
          <Textarea
            id="action-notes"
            placeholder="행동 결정의 근거..."
            value={actionNotes}
            onChange={(e) =>
              updateStep(simulation.id, 8, { actionNotes: e.target.value })
            }
            className="min-h-[80px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
