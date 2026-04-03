"use client";

import { useState } from "react";
import { ArrowLeft, MapPin } from "lucide-react";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import {
  TIER_LABELS,
  TIER_COLORS,
  type SurvivalTier,
} from "@/types/treasure-map";
import { Input } from "@/components/ui/input";

const TIERS: SurvivalTier[] = ["HIGHEST", "HIGH", "MEDIUM", "MODERATE", "LOW"];

export function DistrictCreateForm() {
  const addCustomDistrict = useTreasureMapStore((s) => s.addCustomDistrict);
  const setPanelMode = useTreasureMapStore((s) => s.setPanelMode);
  const createDraft = useTreasureMapStore((s) => s.createDraft);
  const clearCreateDraft = useTreasureMapStore((s) => s.clearCreateDraft);

  const [nameKo, setNameKo] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [tier, setTier] = useState<SurvivalTier>("MEDIUM");
  const [tierReason, setTierReason] = useState("");

  const isValid = nameKo.trim() !== "" && createDraft !== null;

  const handleSubmit = () => {
    if (!isValid || !createDraft) return;
    addCustomDistrict({
      name_ko: nameKo.trim(),
      name_en: nameEn.trim() || nameKo.trim(),
      region: createDraft.region,
      tier,
      tierReason: tierReason.trim(),
      lat: createDraft.lat,
      lng: createDraft.lng,
      criteria: undefined as never,
      rightsData: undefined as never,
      haasScores: undefined as never,
    });
    clearCreateDraft();
  };

  const handleBack = () => {
    clearCreateDraft();
    setPanelMode("list");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          onClick={handleBack}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="목록으로"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold">새 지역 추가</h2>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-4 overflow-y-auto hide-native-scrollbar px-4 py-4">
        {/* Location (auto-filled from map search) */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            📍 위치
          </label>
          {createDraft ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                {createDraft.region || "주소 없음"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {createDraft.lat.toFixed(6)}, {createDraft.lng.toFixed(6)}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              지도에서 위치를 먼저 선택해주세요
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            지역명 (한국어) *
          </label>
          <Input
            value={nameKo}
            onChange={(e) => setNameKo(e.target.value)}
            placeholder="예: 판교"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            지역명 (영어)
          </label>
          <Input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="예: Pangyo"
            className="h-8 text-sm"
          />
        </div>

        {/* Tier selector */}
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">
            생존 등급
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  tier === t
                    ? "border-foreground/30 bg-muted font-medium text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: TIER_COLORS[t] }}
                />
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            등급 사유
          </label>
          <textarea
            value={tierReason}
            onChange={(e) => setTierReason(e.target.value)}
            placeholder="이 등급을 부여한 이유..."
            className="min-h-[60px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          상세 데이터(매매가, 권리분석, HaaS 등)는 추가 후 탭에서 편집할 수
          있습니다.
        </p>
      </div>

      {/* Submit */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full rounded-md bg-[#A71C2E] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8a1726] disabled:cursor-not-allowed disabled:opacity-40"
        >
          추가
        </button>
      </div>
    </div>
  );
}
