"use client";

import { useState } from "react";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { getCountryNameKo, getFlagEmoji } from "@/data/country-names";
import { Button } from "@/components/ui/button";
import { Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LINE_COLOR_PRESETS,
  type CapitalFlow,
  type EditTab,
  type LineStyle,
  type RelationType,
} from "@/types/macro-map";

type FlowType = CapitalFlow["type"];

const FLOW_TYPE_CONFIG: { type: FlowType; label: string }[] = [
  { type: "fdi", label: "FDI" },
  { type: "portfolio", label: "포트폴리오" },
  { type: "trade", label: "무역" },
];

const RELATION_DEFAULTS: Record<RelationType, { color: string; lineStyle: LineStyle }> = {
  ally: { color: "#3b82f6", lineStyle: "solid" },
  rival: { color: "#800020", lineStyle: "dashed" },
};

export function EditPopover() {
  const popover = useMacroMapStore((s) => s.editPopover);
  const editBase = useMacroMapStore((s) => s.editBase);
  const capitalFlows = useMacroMapStore((s) => s.capitalFlows);
  const relations = useMacroMapStore((s) => s.relations);

  if (!popover || !editBase) return null;

  const existingFlow = capitalFlows.find(
    (f) => f.from_iso === editBase && f.to_iso === popover.targetIso,
  );
  const existingRelation = relations.find(
    (r) => r.from_iso === editBase && r.to_iso === popover.targetIso,
  );

  return (
    <EditPopoverForm
      key={`${editBase}-${popover.targetIso}`}
      popover={popover}
      editBase={editBase}
      existingFlow={existingFlow}
      existingRelation={existingRelation}
    />
  );
}

interface EditPopoverFormProps {
  popover: { x: number; y: number; targetIso: string; activeTab: EditTab };
  editBase: string;
  existingFlow: CapitalFlow | undefined;
  existingRelation: { id: string; from_iso: string; to_iso: string; type: RelationType; color: string; lineStyle: LineStyle } | undefined;
}

function EditPopoverForm({
  popover,
  editBase,
  existingFlow,
  existingRelation,
}: EditPopoverFormProps) {
  const addFlow = useMacroMapStore((s) => s.addFlow);
  const updateFlow = useMacroMapStore((s) => s.updateFlow);
  const removeFlow = useMacroMapStore((s) => s.removeFlow);
  const addRelation = useMacroMapStore((s) => s.addRelation);
  const removeRelation = useMacroMapStore((s) => s.removeRelation);
  const setEditTab = useMacroMapStore((s) => s.setEditTab);
  const hideEditPopover = useMacroMapStore((s) => s.hideEditPopover);

  // Flow form state
  const [flowType, setFlowType] = useState<FlowType>(existingFlow?.type ?? "trade");
  const [volume, setVolume] = useState(existingFlow ? String(existingFlow.volume) : "");
  const [label, setLabel] = useState(existingFlow?.label ?? "");
  const [flowColor, setFlowColor] = useState(existingFlow?.color ?? "#e67e22");
  const [flowLineStyle, setFlowLineStyle] = useState<LineStyle>(existingFlow?.lineStyle ?? "dashed");

  // Relation form state
  const [relationType, setRelationType] = useState<RelationType | null>(existingRelation?.type ?? null);
  const [relationColor, setRelationColor] = useState(existingRelation?.color ?? "#3b82f6");
  const [relationLineStyle, setRelationLineStyle] = useState<LineStyle>(existingRelation?.lineStyle ?? "solid");
  // 사용자가 직접 색상/스타일을 변경했는지 추적
  const [userChangedRelStyle, setUserChangedRelStyle] = useState(false);

  const nameKo = getCountryNameKo(popover.targetIso);
  const flag = getFlagEmoji(popover.targetIso);
  const baseName = getCountryNameKo(editBase);
  const baseFlag = getFlagEmoji(editBase);

  const activeTab = popover.activeTab;
  const hasFlow = !!existingFlow;
  const hasRelation = !!existingRelation;

  // ── Flow handlers ──
  const handleFlowConfirm = () => {
    const vol = Number(volume);
    if (!vol || vol <= 0) return;
    const flowLabel = label.trim() || `${baseName}→${nameKo}`;

    if (existingFlow) {
      updateFlow(existingFlow.id, {
        type: flowType,
        volume: vol,
        label: flowLabel,
        color: flowColor,
        lineStyle: flowLineStyle,
      });
    } else {
      addFlow(editBase, popover.targetIso, flowType, vol, flowLabel, flowColor, flowLineStyle);
    }
  };

  const handleFlowRemove = () => {
    if (existingFlow) removeFlow(existingFlow.id);
  };

  // ── Relation handlers ──
  const handleRelationAdd = (type: RelationType) => {
    // 타입 변경 시, 사용자가 스타일을 직접 변경하지 않았으면 기본값으로 설정
    if (!userChangedRelStyle) {
      const defaults = RELATION_DEFAULTS[type];
      setRelationColor(defaults.color);
      setRelationLineStyle(defaults.lineStyle);
    }
    setRelationType(type);
  };

  const handleRelationConfirm = () => {
    if (!relationType) return;
    const color = userChangedRelStyle ? relationColor : RELATION_DEFAULTS[relationType].color;
    const ls = userChangedRelStyle ? relationLineStyle : RELATION_DEFAULTS[relationType].lineStyle;
    addRelation(editBase, popover.targetIso, relationType, color, ls);
  };

  const handleRelationRemove = () => {
    if (existingRelation) removeRelation(existingRelation.id);
  };

  return (
    <div
      className="absolute z-20 w-72 rounded-lg border border-border bg-background/95 p-3 shadow-lg backdrop-blur-sm"
      style={{
        left: popover.x,
        top: popover.y,
        transform: "translate(-50%, -100%) translateY(-12px)",
      }}
    >
      {/* 헤더 */}
      <div className="mb-3 text-center text-sm font-medium">
        {baseFlag} {baseName} → {flag} {nameKo}
      </div>

      {/* 탭 바 */}
      <div className="mb-3 flex gap-1">
        <button
          onClick={() => setEditTab("flow")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            activeTab === "flow"
              ? "bg-orange-600/20 text-orange-400 ring-1 ring-orange-600/50"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          자본흐름
          {hasFlow && (
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          )}
        </button>
        <button
          onClick={() => setEditTab("relation")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            activeTab === "relation"
              ? "bg-[#800020]/20 text-[#cc4060] ring-1 ring-[#800020]/50"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          관계선
          {hasRelation && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#800020]" />
          )}
        </button>
      </div>

      {/* ── 자본흐름 폼 ── */}
      {activeTab === "flow" && (
        <>
          {/* 유형 선택 */}
          <div className="mb-2.5 flex gap-1.5">
            {FLOW_TYPE_CONFIG.map(({ type, label: typeLabel }) => (
              <Button
                key={type}
                size="sm"
                onClick={() => setFlowType(type)}
                className={cn(
                  "flex-1 text-xs",
                  flowType === type
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "border border-orange-600 bg-transparent text-orange-400 hover:bg-orange-600/20",
                )}
              >
                {typeLabel}
              </Button>
            ))}
          </div>

          {/* 볼륨 */}
          <div className="mb-2">
            <label className="mb-1 block text-[11px] text-muted-foreground">규모 (십억 USD)</label>
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

          {/* 라벨 */}
          <div className="mb-2.5">
            <label className="mb-1 block text-[11px] text-muted-foreground">라벨 (선택)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${baseName}→${nameKo}`}
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-orange-500"
            />
          </div>

          {/* 색상 프리셋 */}
          <div className="mb-2">
            <label className="mb-1 block text-[11px] text-muted-foreground">색상</label>
            <div className="flex gap-1.5">
              {LINE_COLOR_PRESETS.map(({ value }) => (
                <button
                  key={value}
                  onClick={() => setFlowColor(value)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform",
                    flowColor === value ? "scale-110 border-white" : "border-transparent",
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          {/* 선 스타일 */}
          <div className="mb-3">
            <label className="mb-1 block text-[11px] text-muted-foreground">선 스타일</label>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={() => setFlowLineStyle("solid")}
                className={cn(
                  "flex-1 text-xs",
                  flowLineStyle === "solid"
                    ? "bg-foreground/15 text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                ━━ 실선
              </Button>
              <Button
                size="sm"
                onClick={() => setFlowLineStyle("dashed")}
                className={cn(
                  "flex-1 text-xs",
                  flowLineStyle === "dashed"
                    ? "bg-foreground/15 text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                ┅┅ 점선
              </Button>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleFlowConfirm}
              disabled={!volume || Number(volume) <= 0}
              className="flex-1 gap-1.5 bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {existingFlow ? "수정" : "추가"}
            </Button>
            {existingFlow && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFlowRemove}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={hideEditPopover}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* ── 관계선 폼 ── */}
      {activeTab === "relation" && (
        <>
          {/* 관계 타입 */}
          <div className="mb-2.5 flex gap-1.5">
            <Button
              size="sm"
              onClick={() => handleRelationAdd("ally")}
              className={cn(
                "flex-1",
                relationType === "ally"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-blue-600 bg-transparent text-blue-400 hover:bg-blue-600/20",
              )}
            >
              동맹
            </Button>
            <Button
              size="sm"
              onClick={() => handleRelationAdd("rival")}
              className={cn(
                "flex-1",
                relationType === "rival"
                  ? "bg-[#800020] text-white hover:bg-[#990028]"
                  : "border border-[#800020] bg-transparent text-[#cc4060] hover:bg-[#800020]/20",
              )}
            >
              적국
            </Button>
          </div>

          {/* 색상 프리셋 */}
          <div className="mb-2">
            <label className="mb-1 block text-[11px] text-muted-foreground">색상</label>
            <div className="flex gap-1.5">
              {LINE_COLOR_PRESETS.map(({ value }) => (
                <button
                  key={value}
                  onClick={() => {
                    setRelationColor(value);
                    setUserChangedRelStyle(true);
                  }}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform",
                    relationColor === value ? "scale-110 border-white" : "border-transparent",
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>
          </div>

          {/* 선 스타일 */}
          <div className="mb-3">
            <label className="mb-1 block text-[11px] text-muted-foreground">선 스타일</label>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                onClick={() => {
                  setRelationLineStyle("solid");
                  setUserChangedRelStyle(true);
                }}
                className={cn(
                  "flex-1 text-xs",
                  relationLineStyle === "solid"
                    ? "bg-foreground/15 text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                ━━ 실선
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setRelationLineStyle("dashed");
                  setUserChangedRelStyle(true);
                }}
                className={cn(
                  "flex-1 text-xs",
                  relationLineStyle === "dashed"
                    ? "bg-foreground/15 text-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted",
                )}
              >
                ┅┅ 점선
              </Button>
            </div>
          </div>

          {/* 액션 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleRelationConfirm}
              disabled={!relationType}
              className={cn(
                "flex-1 gap-1.5 text-white disabled:opacity-50",
                relationType === "rival"
                  ? "bg-[#800020] hover:bg-[#990028]"
                  : "bg-blue-600 hover:bg-blue-700",
              )}
            >
              <Check className="h-4 w-4" />
              {existingRelation ? "수정" : "추가"}
            </Button>
            {existingRelation && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRelationRemove}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={hideEditPopover}
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
