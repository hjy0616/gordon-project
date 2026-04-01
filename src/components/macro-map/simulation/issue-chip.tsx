"use client";

import { cn } from "@/lib/utils";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import type { EconomicIssue } from "@/types/macro-map";

interface IssueChipProps {
  issue: EconomicIssue;
}

export function IssueChip({ issue }: IssueChipProps) {
  const expandedIssueId = useMacroMapStore((s) => s.expandedIssueId);
  const setExpandedIssue = useMacroMapStore((s) => s.setExpandedIssue);
  const isActive = expandedIssueId === issue.id;

  return (
    <button
      onClick={() => {
        setExpandedIssue(isActive ? null : issue.id);
        if (!isActive && !useMacroMapStore.getState().issueBarExpanded) {
          useMacroMapStore.getState().toggleIssueBar();
        }
      }}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {issue.title}
    </button>
  );
}
