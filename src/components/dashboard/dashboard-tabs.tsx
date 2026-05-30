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

      <TabsContent value="macro" keepMounted className="mt-6">
        <MacroDashboard />
      </TabsContent>

      <TabsContent value="market" keepMounted className="mt-6">
        {marketOpened && <MarketTab />}
      </TabsContent>
    </Tabs>
  );
}
