"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { Simulation } from "@/types/lasagna";
import { StepperNav } from "../stepper/stepper-nav";
import { StepContainer } from "../stepper/step-container";
import { FlowOverview } from "./flow-overview";
import { CrowdPanel } from "./crowd-panel";
import { MyPanel } from "./my-panel";

interface SummaryViewProps {
  simulation: Simulation;
}

export function SummaryView({ simulation }: SummaryViewProps) {
  return (
    <Tabs defaultValue="summary" className="flex h-full flex-col">
      <TabsList className="mx-4 mt-3 w-fit">
        <TabsTrigger value="steps">Steps</TabsTrigger>
        <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
        <TabsTrigger value="summary">Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="steps" className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <StepperNav simulation={simulation} />
          <StepContainer simulation={simulation} />
        </div>
      </TabsContent>

      <TabsContent value="mindmap" className="flex-1 overflow-hidden p-4">
        <FlowOverview simulation={simulation} />
      </TabsContent>

      <TabsContent value="summary" className="flex-1 overflow-y-auto p-4">
        <h2 className="mb-4 text-base font-semibold">
          {simulation.title} — 판단 분리
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <CrowdPanel simulation={simulation} />
          <MyPanel simulation={simulation} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
