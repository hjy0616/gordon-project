"use client";

import { useRef, useState, useCallback } from "react";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { SUPERPOWER_CONFIG } from "@/types/macro-map";
import { COUNTRY_MAP } from "@/data/mock-countries";

export function G2PerspectivePanel() {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const objectives = useMacroMapStore((s) => s.objectives);
  const updateObjective = useMacroMapStore((s) => s.updateObjective);

  const cfg = SUPERPOWER_CONFIG[activeSuperpower];
  const countryData = COUNTRY_MAP.get(activeSuperpower);

  const debounceP = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debounceS = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [prevSp, setPrevSp] = useState(activeSuperpower);
  const [localPrinciple, setLocalPrinciple] = useState(
    objectives[activeSuperpower].principle,
  );
  const [localStrategic, setLocalStrategic] = useState(
    objectives[activeSuperpower].strategicIntent,
  );

  // 시점 전환 시 로컬 상태 리셋
  if (activeSuperpower !== prevSp) {
    setPrevSp(activeSuperpower);
    setLocalPrinciple(objectives[activeSuperpower].principle);
    setLocalStrategic(objectives[activeSuperpower].strategicIntent);
  }

  const handlePrincipleChange = useCallback(
    (value: string) => {
      setLocalPrinciple(value);
      if (debounceP.current) clearTimeout(debounceP.current);
      debounceP.current = setTimeout(() => {
        updateObjective(activeSuperpower, "principle", value);
      }, 300);
    },
    [activeSuperpower, updateObjective],
  );

  const handleStrategicChange = useCallback(
    (value: string) => {
      setLocalStrategic(value);
      if (debounceS.current) clearTimeout(debounceS.current);
      debounceS.current = setTimeout(() => {
        updateObjective(activeSuperpower, "strategicIntent", value);
      }, 300);
    },
    [activeSuperpower, updateObjective],
  );

  return (
    <div className="flex w-[40%] shrink-0 flex-col overflow-y-auto border-r border-border p-4 md:w-[40%]">
      {/* 국가 정보 헤더 */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{cfg.flag}</span>
        <div>
          <h2 className="text-lg font-semibold">{cfg.label}</h2>
          {countryData && (
            <p className="text-xs text-muted-foreground">
              GDP ${countryData.gdp_nominal}B · {countryData.name}
            </p>
          )}
        </div>
      </div>

      {/* 1원칙 목적 */}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium">
          1원칙 목적
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          이 초강대국이 추구하는 가장 근본적인 목적을 정의하세요
        </p>
        <textarea
          value={localPrinciple}
          onChange={(e) => handlePrincipleChange(e.target.value)}
          placeholder="예: 글로벌 경제 패권 유지 및 달러 기축통화 체제 강화"
          className="h-24 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* 전략적 분석 */}
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium">
          전략적 분석
        </label>
        <p className="mb-2 text-xs text-muted-foreground">
          {cfg.label}의 시점에서 전략적 의도와 분석을 작성하세요
        </p>
        <textarea
          value={localStrategic}
          onChange={(e) => handleStrategicChange(e.target.value)}
          placeholder="이 초강대국의 전략적 의도, 행동 패턴, 핵심 이해관계를 분석하세요..."
          className="min-h-[200px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
    </div>
  );
}
