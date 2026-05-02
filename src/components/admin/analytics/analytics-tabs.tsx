"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeSection } from "./realtime-card";
import { GrowthSection } from "./growth-chart";
import { CohortSection } from "./cohort-heatmap";
import { ChurnSection } from "./churn-section";
import { InflowSection } from "./inflow-section";
import { EngagementSection } from "./engagement-section";
import { EventsSection } from "./events-section";
import { KpiGrid } from "./kpi-grid";
import { UserActivitySection } from "./user-activity-section";

// Tabs는 비활성 children도 mount하지만 hidden(display:none) 상태이다.
// Recharts ResponsiveContainer는 display:none에서 mount되면 측정이 안 되어 차트가 빈 화면.
// → 활성 탭일 때만 children을 render(lazy mount)하여 mount 시점에 visible 보장.

export function AnalyticsTabs() {
  const [active, setActive] = useState("realtime");

  return (
    <Tabs
      value={active}
      onValueChange={setActive}
      className="flex flex-col gap-4"
    >
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="realtime">실시간</TabsTrigger>
          <TabsTrigger value="user-activity">유저 활동</TabsTrigger>
          <TabsTrigger value="growth">성장</TabsTrigger>
          <TabsTrigger value="retention">리텐션</TabsTrigger>
          <TabsTrigger value="churn">이탈</TabsTrigger>
          <TabsTrigger value="inflow">유입</TabsTrigger>
          <TabsTrigger value="engagement">참여</TabsTrigger>
          <TabsTrigger value="events">Wow·Pain</TabsTrigger>
          <TabsTrigger value="kpi">KPI</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="realtime" className="mt-2">
        {active === "realtime" && <RealtimeSection />}
      </TabsContent>

      <TabsContent value="user-activity" className="mt-2">
        {active === "user-activity" && <UserActivitySection />}
      </TabsContent>

      <TabsContent value="growth" className="mt-2">
        {active === "growth" && <GrowthSection />}
      </TabsContent>

      <TabsContent value="retention" className="mt-2">
        {active === "retention" && <CohortSection />}
      </TabsContent>

      <TabsContent value="churn" className="mt-2">
        {active === "churn" && <ChurnSection />}
      </TabsContent>

      <TabsContent value="inflow" className="mt-2">
        {active === "inflow" && <InflowSection />}
      </TabsContent>

      <TabsContent value="engagement" className="mt-2">
        {active === "engagement" && <EngagementSection />}
      </TabsContent>

      <TabsContent value="events" className="mt-2">
        {active === "events" && <EventsSection />}
      </TabsContent>

      <TabsContent value="kpi" className="mt-2">
        {active === "kpi" && <KpiGrid />}
      </TabsContent>
    </Tabs>
  );
}
