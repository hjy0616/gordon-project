"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-2 py-2 text-sm font-semibold">
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
