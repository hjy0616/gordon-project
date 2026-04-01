"use client";

import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { Button } from "@/components/ui/button";
import { SUPERPOWER_CONFIG, type SuperpowerCode } from "@/types/macro-map";

const SUPERPOWERS: SuperpowerCode[] = ["USA", "CHN"];

export function SimulationHeader() {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const setActiveSuperpower = useMacroMapStore((s) => s.setActiveSuperpower);

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2">
      <span className="text-sm font-medium text-muted-foreground">
        G2 시점
      </span>
      <div className="flex gap-1 rounded-lg border border-border bg-background/80 p-1">
        {SUPERPOWERS.map((code) => {
          const cfg = SUPERPOWER_CONFIG[code];
          const isActive = activeSuperpower === code;
          return (
            <Button
              key={code}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSuperpower(code)}
              className="gap-1.5"
              style={
                isActive
                  ? { backgroundColor: cfg.color, color: "#fff" }
                  : undefined
              }
            >
              <span>{cfg.flag}</span>
              <span>{cfg.label}</span>
            </Button>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">
        {SUPERPOWER_CONFIG[activeSuperpower].flag}{" "}
        {SUPERPOWER_CONFIG[activeSuperpower].label}의 시점에서 세계를 분석합니다
      </span>
    </div>
  );
}
