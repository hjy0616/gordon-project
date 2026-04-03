"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { EVENT_CATEGORIES } from "@/types/lasagna";
import { cn } from "@/lib/utils";

export function SimulationCreateForm() {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState("");
  const [customEvents, setCustomEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState("");

  const createSimulation = useLasagnaStore((s) => s.createSimulation);
  const setPanelMode = useLasagnaStore((s) => s.setPanelMode);

  const canSubmit = title.trim() && eventType && eventDescription.trim();

  const allEvents = [
    ...EVENT_CATEGORIES.map((c) => ({ key: c.value, label: c.label, custom: false })),
    ...customEvents.map((label) => ({ key: label, label, custom: true })),
  ];

  function addCustomEvent() {
    const tag = newEvent.trim();
    if (!tag || customEvents.includes(tag)) return;
    setCustomEvents((prev) => [...prev, tag]);
    setEventType(tag);
    setNewEvent("");
  }

  function removeCustomEvent(label: string) {
    setCustomEvents((prev) => prev.filter((e) => e !== label));
    if (eventType === label) setEventType(null);
  }

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
          {allEvents.map((evt) => (
            <span key={evt.key} className="inline-flex items-center">
              <button
                type="button"
                onClick={() => setEventType(evt.key)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  eventType === evt.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                  evt.custom && "pr-1.5",
                )}
              >
                {evt.label}
                {evt.custom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomEvent(evt.label);
                    }}
                    className="ml-1.5 inline-flex rounded-full p-0.5 hover:bg-primary-foreground/20"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="커스텀 이벤트 유형..."
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomEvent();
              }
            }}
            className="h-8 flex-1 text-xs"
          />
          <button
            type="button"
            onClick={addCustomEvent}
            disabled={!newEvent.trim()}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-dashed border-primary/50 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
          >
            <Plus className="size-3" />
            추가
          </button>
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
