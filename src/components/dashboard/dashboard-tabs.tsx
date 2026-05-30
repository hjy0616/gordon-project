"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MacroDashboard } from "@/components/dashboard/macro-dashboard";
import { MarketTab } from "@/components/dashboard/tradingview/market-tab";

type TabKey = "macro" | "market";

export function DashboardTabs() {
  const [tab, setTab] = useState<TabKey>("macro");
  const [marketOpened, setMarketOpened] = useState(false);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (!value) return;
        const next = value as TabKey;
        setTab(next);
        if (next === "market") setMarketOpened(true);
      }}
    >
      <TabsList>
        <TabsTrigger value="macro">거시 지표</TabsTrigger>
        <TabsTrigger value="market">실시간 마켓</TabsTrigger>
      </TabsList>

      {/* macro는 기본 탭이라 "보이는 상태"로 첫 마운트됨 → 내부 Recharts가 정상 측정된다.
          keepMounted로 상주시켜 탭 전환 시 React Query 재요청(특히 rate-limit 민감한 Yahoo)을 막는다.
          ⚠️ 기본 탭을 market으로 바꾸거나 analytics-tabs식 {tab === "macro" && ...} 가드로 바꾸면
          macro가 숨겨진 채 첫 마운트되어 Recharts가 빈 화면이 된다. 현 구조를 유지할 것. */}
      <TabsContent value="macro" keepMounted className="mt-6">
        <MacroDashboard />
      </TabsContent>

      <TabsContent value="market" keepMounted className="mt-6">
        {marketOpened && <MarketTab />}
      </TabsContent>
    </Tabs>
  );
}
