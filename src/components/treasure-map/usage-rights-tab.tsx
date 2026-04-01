"use client";

import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import type { DistrictRightsData } from "@/types/treasure-map";

interface UsageRightsTabProps {
  rightsData: DistrictRightsData;
  districtId: string;
}

export function UsageRightsTab({ rightsData, districtId }: UsageRightsTabProps) {
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);
  const updateUsage = useTreasureMapStore((s) => s.updateDistrictUsageInput);

  const defaults = {
    jeonseDeposit: Math.round(rightsData.avgJeonse / 10),
    wolseMonthly: rightsData.avgWolse,
    haasSubscription: rightsData.haasEstimate,
  };
  const inputs = districtEdits[districtId]?.usageSimInputs ?? defaults;

  const jeonseDeposit = inputs.jeonseDeposit;
  const wolseMonthly = inputs.wolseMonthly;
  const haasSubscription = inputs.haasSubscription;

  const traditionalMonthlyCost =
    Math.round((jeonseDeposit * 10000 * 0.035) / 12 / 10000) + wolseMonthly;
  const haasMonthlyCost = haasSubscription;
  const diff = traditionalMonthlyCost - haasMonthlyCost;

  return (
    <div className="space-y-4">
      {/* ── Comparison Card ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 px-3 py-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            전통 전월세
          </p>
          <div className="mt-2 space-y-1.5">
            <div>
              <p className="text-[10px] text-muted-foreground">전세 보증금</p>
              <p className="text-sm font-medium">
                {rightsData.avgJeonse.toLocaleString()}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  만원
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">월세</p>
              <p className="text-sm font-medium">
                {rightsData.avgWolse.toLocaleString()}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  만원/월
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 px-3 py-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            HaaS 구독
          </p>
          <div className="mt-2 space-y-1.5">
            <div>
              <p className="text-[10px] text-muted-foreground">월 구독료</p>
              <p className="text-sm font-medium">
                {rightsData.haasEstimate.toLocaleString()}
                <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                  만원/월
                </span>
              </p>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              (관리·보안·IoT 패키지 포함)
            </p>
          </div>
        </div>
      </div>

      {/* ── Interactive Inputs ── */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">
          시뮬레이션 입력
        </h4>

        <label className="block space-y-1">
          <span className="text-[11px] text-muted-foreground">
            전세 보증금 (만원)
          </span>
          <input
            type="number"
            value={jeonseDeposit}
            onChange={(e) =>
              updateUsage(districtId, "jeonseDeposit", Number(e.target.value))
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] text-muted-foreground">
            월세 (만원/월)
          </span>
          <input
            type="number"
            value={wolseMonthly}
            onChange={(e) =>
              updateUsage(districtId, "wolseMonthly", Number(e.target.value))
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] text-muted-foreground">
            HaaS 구독료 (만원/월)
          </span>
          <input
            type="number"
            value={haasSubscription}
            onChange={(e) =>
              updateUsage(
                districtId,
                "haasSubscription",
                Number(e.target.value),
              )
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </label>
      </div>

      {/* ── Computed Comparison ── */}
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>전통 방식 월 비용</span>
          <span className="font-medium text-foreground">
            {traditionalMonthlyCost.toLocaleString()} 만원
          </span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>HaaS 월 비용</span>
          <span className="font-medium text-foreground">
            {haasMonthlyCost.toLocaleString()} 만원
          </span>
        </div>
        <div className="mt-3 border-t border-border pt-2.5">
          <p
            className={`text-center text-sm font-semibold ${
              diff > 0 ? "text-emerald-500" : "text-red-400"
            }`}
          >
            {diff > 0
              ? `월 ${diff.toLocaleString()}만원 절약`
              : `월 ${Math.abs(diff).toLocaleString()}만원 추가`}
          </p>
        </div>
      </div>
    </div>
  );
}
