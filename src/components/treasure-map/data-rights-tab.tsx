"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { getEffectiveRadar, type RadarScores } from "@/types/treasure-map";
import { useChartReady } from "@/hooks/use-chart-ready";

const RADAR_AXES: { key: keyof RadarScores; label: string }[] = [
  { key: "iotDensity", label: "IoT 밀도" },
  { key: "transactionVolume", label: "거래량" },
  { key: "uniqueVisitors", label: "방문자" },
  { key: "platformEngagement", label: "플랫폼 참여" },
  { key: "dataQuality", label: "데이터 품질" },
];

interface DataRightsTabProps {
  radarScores: RadarScores;
  districtId: string;
}

export function DataRightsTab({ radarScores, districtId }: DataRightsTabProps) {
  const districtEdits = useTreasureMapStore((s) => s.districtEdits);
  const updateRadar = useTreasureMapStore((s) => s.updateDistrictRadarScore);
  const { ref: chartRef, ready: chartReady } = useChartReady();

  const edits = districtEdits[districtId]?.radarScores;
  const effective = getEffectiveRadar(radarScores, edits);

  const data = RADAR_AXES.map((a) => ({
    axis: a.label,
    baseline: radarScores[a.key],
    user: effective[a.key],
  }));

  const avgScore = Math.round(
    RADAR_AXES.reduce((sum, a) => sum + effective[a.key], 0) / RADAR_AXES.length,
  );

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-medium text-muted-foreground">
        데이터 수익화 역량
      </h4>

      {/* Input sliders */}
      <div className="space-y-3">
        {RADAR_AXES.map((a) => (
          <div key={a.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{a.label}</span>
              <span className="font-medium tabular-nums">
                {effective[a.key]}
                <span className="text-muted-foreground">/100</span>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={effective[a.key]}
              onChange={(e) =>
                updateRadar(districtId, a.key, Number(e.target.value))
              }
              className="w-full accent-[#A71C2E]"
            />
          </div>
        ))}
      </div>

      {/* Dual radar chart */}
      <div ref={chartRef} className="h-[260px] w-full">
        {chartReady && (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "#aaa", fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#666", fontSize: 10 }}
                axisLine={false}
              />
              <Radar
                name="기준선"
                dataKey="baseline"
                stroke="#757575"
                fill="#757575"
                fillOpacity={0.1}
              />
              <Radar
                name="사용자 입력"
                dataKey="user"
                stroke="#A71C2E"
                fill="#A71C2E"
                fillOpacity={0.3}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconSize={10} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Average score */}
      <div className="rounded-lg border border-border px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">데이터 생산력 점수</p>
        <p className="mt-1 text-2xl font-bold">{avgScore}</p>
      </div>
    </div>
  );
}
