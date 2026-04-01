"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { computeScenarioData } from "@/data/haas-baseline-params";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import type { KoreanDistrict, CustomDistrict } from "@/types/treasure-map";
import { getEffectiveHaaS, computeHaaSTotal } from "@/types/treasure-map";
import { useChartReady } from "@/hooks/use-chart-ready";

interface ScenarioViewerProps {
  district: KoreanDistrict | CustomDistrict;
}

export function ScenarioViewer({ district }: ScenarioViewerProps) {
  const adoptionRate = useTreasureMapStore((s) => s.adoptionRate);
  const setAdoptionRate = useTreasureMapStore((s) => s.setAdoptionRate);
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);

  const haasTotal = useMemo(() => {
    const edits = districtEdits[district.id]?.haasScores;
    const effective = getEffectiveHaaS(district.haasScores, edits);
    return computeHaaSTotal(effective);
  }, [district, districtEdits]);

  const { ref: chartRef, ready: chartReady } = useChartReady();

  const haasBonus = ((haasTotal - 50) / 100) * 0.02;

  const scenarioData = useMemo(
    () => computeScenarioData(adoptionRate, haasBonus),
    [adoptionRate, haasBonus],
  );

  return (
    <div>
      {/* HaaS score indicator */}
      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          HaaS 점수 반영
        </span>
        <span className="text-xs font-medium">
          {haasTotal}점{" "}
          <span
            className={
              haasBonus >= 0 ? "text-emerald-500" : "text-red-400"
            }
          >
            ({haasBonus >= 0 ? "+" : ""}
            {(haasBonus * 100).toFixed(1)}%)
          </span>
        </span>
      </div>

      <div ref={chartRef} className="h-[280px] w-full">
        {chartReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={scenarioData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#888" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#888"
                unit="%"
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="platformYield"
                name="플랫폼 통합"
                stroke="#A71C2E"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="nonPlatformYield"
                name="비통합"
                stroke="#757575"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Adoption rate slider */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">플랫폼 채택률</span>
          <span className="font-semibold text-[#A71C2E]">
            {adoptionRate}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={adoptionRate}
          onChange={(e) => setAdoptionRate(Number(e.target.value))}
          className="w-full accent-[#A71C2E]"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
