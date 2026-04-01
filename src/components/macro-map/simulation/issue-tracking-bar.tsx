"use client";

import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { cn } from "@/lib/utils";
import { IssueChip } from "./issue-chip";
import { IssueEditorInline } from "./issue-editor";
import { SUPERPOWER_CONFIG } from "@/types/macro-map";

export function IssueTrackingBar() {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const issues = useMacroMapStore((s) => s.issues);
  const addIssue = useMacroMapStore((s) => s.addIssue);
  const issueBarExpanded = useMacroMapStore((s) => s.issueBarExpanded);
  const toggleIssueBar = useMacroMapStore((s) => s.toggleIssueBar);
  const expandedIssueId = useMacroMapStore((s) => s.expandedIssueId);

  const currentIssues = issues[activeSuperpower];
  const cfg = SUPERPOWER_CONFIG[activeSuperpower];

  return (
    <div
      className={cn(
        "shrink-0 border-t border-border bg-background/95 backdrop-blur-sm transition-all duration-300",
        issueBarExpanded ? "h-[40vh]" : "h-12",
      )}
    >
      {/* 항상 표시: 칩 바 */}
      <div className="flex h-12 items-center gap-2 px-4">
        <Button variant="ghost" size="icon-sm" onClick={toggleIssueBar}>
          {issueBarExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>

        <span className="shrink-0 text-sm font-medium">이슈 트래킹</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {cfg.flag} {cfg.label}
        </span>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div className="flex gap-1.5 overflow-x-auto">
          {currentIssues.map((issue) => (
            <IssueChip key={issue.id} issue={issue} />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => addIssue(activeSuperpower, "새 이슈")}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* 확장 시: 이슈 에디터 */}
      {issueBarExpanded && expandedIssueId && (
        <div className="overflow-y-auto px-4 pb-4" style={{ height: "calc(40vh - 3rem)" }}>
          <IssueEditorInline issueId={expandedIssueId} />
        </div>
      )}

      {issueBarExpanded && !expandedIssueId && (
        <div className="flex items-center justify-center" style={{ height: "calc(40vh - 3rem)" }}>
          <p className="text-sm text-muted-foreground">
            이슈를 선택하거나 + 버튼으로 새 이슈를 추가하세요
          </p>
        </div>
      )}
    </div>
  );
}
