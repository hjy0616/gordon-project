"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealtimeSection } from "./realtime-card";
import { GrowthSection } from "./growth-chart";
import { CohortSection } from "./cohort-heatmap";
import { ChurnSection } from "./churn-section";
import { InflowSection } from "./inflow-section";
import { EngagementSection } from "./engagement-section";
import { EventsSection } from "./events-section";
import { KpiGrid } from "./kpi-grid";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="realtime" className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <TabsList>
          <TabsTrigger value="realtime">실시간</TabsTrigger>
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
        <RealtimeSection />
      </TabsContent>

      <TabsContent value="growth" className="mt-2">
        <GrowthSection />
      </TabsContent>

      <TabsContent value="retention" className="mt-2">
        <CohortSection />
      </TabsContent>

      <TabsContent value="churn" className="mt-2">
        <ChurnSection />
      </TabsContent>

      <TabsContent value="inflow" className="mt-2">
        <InflowSection />
      </TabsContent>

      <TabsContent value="engagement" className="mt-2">
        <EngagementSection />
      </TabsContent>

      <TabsContent value="events" className="mt-2">
        <EventsSection />
      </TabsContent>

      <TabsContent value="kpi" className="mt-2">
        <KpiGrid />
      </TabsContent>
    </Tabs>
  );
}
