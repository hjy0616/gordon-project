"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { EVENT_CATEGORIES } from "@/types/lasagna";
import type { EventCategory } from "@/types/lasagna";
import { cn } from "@/lib/utils";

export function SimulationCreateForm() {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<EventCategory | null>(null);
  const [eventDescription, setEventDescription] = useState("");

  const createSimulation = useLasagnaStore((s) => s.createSimulation);
  const setPanelMode = useLasagnaStore((s) => s.setPanelMode);

  const canSubmit = title.trim() && eventType && eventDescription.trim();

  function handleSubmit() {
    if (!canSubmit || !eventType) return;
    createSimulation(title.trim(), eventType, eventDescription.trim());
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          제목
        </label>
        <Input
          placeholder="예: 2024 엔화 급락 시뮬레이션"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          이벤트 유형
        </label>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setEventType(cat.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                eventType === cat.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          이벤트 설명
        </label>
        <Textarea
          placeholder="뉴스 헤드라인이나 상황 설명을 입력하세요. 입력값으로 변환하여 분석합니다."
          rows={4}
          value={eventDescription}
          onChange={(e) => setEventDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => setPanelMode("list")}
        >
          취소
        </Button>
        <Button
          className="flex-1"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          시작
        </Button>
      </div>
    </div>
  );
}
