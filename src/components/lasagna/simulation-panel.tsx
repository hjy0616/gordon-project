"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLasagnaStore } from "@/lib/stores/lasagna-store";
import { SimulationList } from "./simulation-list";
import { SimulationCreateForm } from "./simulation-create-form";

export function SimulationPanel() {
  const panelMode = useLasagnaStore((s) => s.panelMode);
  const setPanelMode = useLasagnaStore((s) => s.setPanelMode);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h2 className="text-sm font-semibold">Simulations</h2>
        {panelMode === "list" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setPanelMode("create")}
          >
            <Plus className="size-3.5" />
            New
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {panelMode === "create" ? (
          <SimulationCreateForm />
        ) : (
          <SimulationList />
        )}
      </div>
    </div>
  );
}
