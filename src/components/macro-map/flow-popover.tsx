"use client";

import { useState } from "react";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryNameKo, getFlagEmoji } from "@/data/country-names";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";
import type { CapitalFlow } from "@/types/macro-map";

type FlowType = CapitalFlow["type"];

const FLOW_TYPE_CONFIG: { type: FlowType; label: string }[] = [
  { type: "fdi", label: "FDI" },
  { type: "portfolio", label: "포트폴리오" },
  { type: "trade", label: "무역" },
];

export function FlowPopover() {
  const popover = useMacroMapStore((s) => s.flowPopover);
  const editBase = useMacroMapStore((s) => s.flowEditBase);
  const capitalFlows = useMacroMapStore((s) => s.capitalFlows);

  if (!popover || !editBase) return null;

  const existing = capitalFlows.find(
    (f) => f.from_iso === editBase && f.to_iso === popover.targetIso,
  );

  // key forces remount when target changes, resetting form state
  return (
    <FlowPopoverForm
      key={`${editBase}-${popover.targetIso}`}
      popover={popover}
      editBase={editBase}
      existing={existing}
    />
  );
}

interface FlowPopoverFormProps {
  popover: { x: number; y: number; targetIso: string };
  editBase: string;
  existing: CapitalFlow | undefined;
}

function FlowPopoverForm({
  popover,
  editBase,
  existing,
}: FlowPopoverFormProps) {
  const addFlow = useMacroMapStore((s) => s.addFlow);
  const updateFlow = useMacroMapStore((s) => s.updateFlow);
  const removeFlow = useMacroMapStore((s) => s.removeFlow);

  const [selectedType, setSelectedType] = useState<FlowType>(
    existing?.type ?? "trade",
  );
  const [volume, setVolume] = useState(
    existing ? String(existing.volume) : "",
  );
  const [label, setLabel] = useState(existing?.label ?? "");

  const nameKo = getCountryNameKo(popover.targetIso);
  const flag = getFlagEmoji(popover.targetIso);
  const baseName = getCountryNameKo(editBase);
  const baseFlag = getFlagEmoji(editBase);

  const handleConfirm = () => {
    const vol = Number(volume);
    if (!vol || vol <= 0) return;
    const flowLabel = label.trim() || `${baseName}→${nameKo}`;

    if (existing) {
      updateFlow(existing.id, {
        type: selectedType,
        volume: vol,
        label: flowLabel,
      });
    } else {
      addFlow(editBase, popover.targetIso, selectedType, vol, flowLabel);
    }
  };

  const handleRemove = () => {
    if (existing) removeFlow(existing.id);
  };

  return (
    <div
      className="absolute z-20 w-64 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm"
      style={{
        left: popover.x,
        top: popover.y,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      {/* 헤더: 출발국 → 도착국 */}
      <div className="mb-3 text-center text-sm font-medium">
        {baseFlag} {baseName} → {flag} {nameKo}
      </div>

      {/* 유형 선택 */}
      <div className="mb-3 flex gap-1.5">
        {FLOW_TYPE_CONFIG.map(({ type, label: typeLabel }) => (
          <Button
            key={type}
            size="sm"
            onClick={() => setSelectedType(type)}
            className={
              selectedType === type
                ? "flex-1 bg-orange-600 text-white hover:bg-orange-700"
                : "flex-1 border border-orange-600 bg-transparent text-orange-400 hover:bg-orange-600/20"
            }
          >
            {typeLabel}
          </Button>
        ))}
      </div>

      {/* 볼륨 입력 */}
      <div className="mb-2">
        <label className="mb-1 block text-[11px] text-muted-foreground">
          규모 (십억 USD)
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          placeholder="예: 100"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-orange-500"
        />
      </div>

      {/* 라벨 입력 */}
      <div className="mb-3">
        <label className="mb-1 block text-[11px] text-muted-foreground">
          라벨 (선택)
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`${baseName}→${nameKo}`}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-orange-500"
        />
      </div>

      {/* 확인 / 삭제 */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!volume || Number(volume) <= 0}
          className="flex-1 gap-1.5 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {existing ? "수정" : "추가"}
        </Button>
        {existing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => useMacroMapStore.getState().hideFlowPopover()}
          className="h-8 w-8 p-0 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
