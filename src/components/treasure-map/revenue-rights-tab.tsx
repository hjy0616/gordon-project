"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import {
  DEFAULT_REVENUE_INPUTS,
  type DistrictRightsData,
} from "@/types/treasure-map";
import { useChartReady } from "@/hooks/use-chart-ready";

interface RevenueRightsTabProps {
  rightsData: DistrictRightsData;
  districtId: string;
  platformPotential: number;
}

export function RevenueRightsTab({
  rightsData,
  districtId,
  platformPotential,
}: RevenueRightsTabProps) {
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);
  const updateRevenue = useTreasureMapStore(
    (s) => s.updateDistrictRevenueInput,
  );
  const { ref: chartRef, ready: chartReady } = useChartReady();

  const inputs =
    districtEdits[districtId]?.revenueInputs ?? DEFAULT_REVENUE_INPUTS;

  const data = useMemo(() => {
    const { holdingYears, tokenRatio, annualAppreciation } = inputs;
    const tr = tokenRatio / 100;
    const ap = annualAppreciation / 100;
    const pp = platformPotential / 200;

    return Array.from({ length: holdingYears }, (_, i) => {
      const baseInst = rightsData.institutionalROI[Math.min(i, 9)] ?? 0;
      const baseToken = rightsData.tokenHolderROI[Math.min(i, 9)] ?? 0;

      return {
        year: `${i + 1}년`,
        institutional: Math.round(baseInst * (1 + ap) * (1 - tr) * 10) / 10,
        tokenHolder: Math.round(baseToken * tr * (1 + pp) * 10) / 10,
      };
    });
  }, [inputs, rightsData, platformPotential]);

  return (
    <div className="space-y-4">
      {/* Scenario inputs */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground">
          시나리오 설정
        </h4>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">보유 기간</span>
            <span className="font-medium tabular-nums">
              {inputs.holdingYears}년
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={inputs.holdingYears}
            onChange={(e) =>
              updateRevenue(districtId, "holdingYears", Number(e.target.value))
            }
            className="w-full accent-[#A71C2E]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">토큰 배분 비율</span>
            <span className="font-medium tabular-nums">
              {inputs.tokenRatio}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={inputs.tokenRatio}
            onChange={(e) =>
              updateRevenue(districtId, "tokenRatio", Number(e.target.value))
            }
            className="w-full accent-[#D4A843]"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">연 자산 상승률</span>
            <span className="font-medium tabular-nums">
              {inputs.annualAppreciation}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={inputs.annualAppreciation}
            onChange={(e) =>
              updateRevenue(
                districtId,
                "annualAppreciation",
                Number(e.target.value),
              )
            }
            className="w-full accent-[#A71C2E]"
          />
        </div>
      </div>

      {/* ROI Chart */}
      <h4 className="text-xs font-medium text-muted-foreground">
        ROI 전망 (%)
      </h4>
      <div ref={chartRef} className="h-[240px] w-full">
        {chartReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="year"
                tick={{ fill: "#aaa", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#aaa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 10%)",
                  border: "1px solid hsl(0 0% 20%)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#aaa" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value) => [`${value}%`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                iconSize={10}
                iconType="square"
              />
              <Bar
                dataKey="institutional"
                name="기관 투자자"
                fill="#A71C2E"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
              <Bar
                dataKey="tokenHolder"
                name="토큰 보유자"
                fill="#D4A843"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
