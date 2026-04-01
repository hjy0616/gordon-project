"use client";

import { useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import {
  ANALYSIS_FIELD_CONFIG,
  type IssueAnalysis,
  type EconomicIssue,
} from "@/types/macro-map";

interface IssueEditorInlineProps {
  issueId: string;
}

/** 데스크탑: 이슈 바 내 인라인 에디터 */
export function IssueEditorInline({ issueId }: IssueEditorInlineProps) {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const issues = useMacroMapStore((s) => s.issues);
  const updateIssue = useMacroMapStore((s) => s.updateIssue);
  const removeIssue = useMacroMapStore((s) => s.removeIssue);

  const issue = issues[activeSuperpower].find((i) => i.id === issueId);
  if (!issue) return null;

  return (
    <IssueForm
      issue={issue}
      onUpdate={(updates) => updateIssue(activeSuperpower, issueId, updates)}
      onDelete={() => removeIssue(activeSuperpower, issueId)}
    />
  );
}

/** 모바일: Sheet 안에서 사용하는 에디터 */
export function IssueEditorSheet({ issueId }: { issueId: string }) {
  const activeSuperpower = useMacroMapStore((s) => s.activeSuperpower);
  const issues = useMacroMapStore((s) => s.issues);
  const updateIssue = useMacroMapStore((s) => s.updateIssue);
  const removeIssue = useMacroMapStore((s) => s.removeIssue);

  const issue = issues[activeSuperpower].find((i) => i.id === issueId);
  if (!issue) return null;

  return (
    <div className="p-4">
      <IssueForm
        issue={issue}
        onUpdate={(updates) => updateIssue(activeSuperpower, issueId, updates)}
        onDelete={() => removeIssue(activeSuperpower, issueId)}
      />
    </div>
  );
}

interface IssueFormProps {
  issue: EconomicIssue;
  onUpdate: (
    updates: Partial<Pick<EconomicIssue, "title" | "analysis">>,
  ) => void;
  onDelete: () => void;
}

function IssueForm({ issue, onUpdate, onDelete }: IssueFormProps) {
  const debounceTitle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debounceAnalysis = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [prevId, setPrevId] = useState(issue.id);
  const [localTitle, setLocalTitle] = useState(issue.title);
  const [localAnalysis, setLocalAnalysis] = useState<IssueAnalysis>(
    issue.analysis,
  );

  // 이슈 전환 시 로컬 상태 리셋
  if (issue.id !== prevId) {
    setPrevId(issue.id);
    setLocalTitle(issue.title);
    setLocalAnalysis(issue.analysis);
  }

  const handleTitleChange = useCallback(
    (value: string) => {
      setLocalTitle(value);
      if (debounceTitle.current) clearTimeout(debounceTitle.current);
      debounceTitle.current = setTimeout(() => {
        onUpdate({ title: value });
      }, 300);
    },
    [onUpdate],
  );

  const handleAnalysisChange = useCallback(
    (key: keyof IssueAnalysis, value: string) => {
      setLocalAnalysis((prev) => {
        const next = { ...prev, [key]: value };
        if (debounceAnalysis.current) clearTimeout(debounceAnalysis.current);
        debounceAnalysis.current = setTimeout(() => {
          onUpdate({ analysis: next });
        }, 300);
        return next;
      });
    },
    [onUpdate],
  );

  return (
    <div className="space-y-3">
      {/* 제목 + 삭제 */}
      <div className="flex items-center gap-2">
        <Input
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="이슈 제목"
          className="h-8 flex-1"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 4단계 분석 */}
      <div className="grid gap-3 md:grid-cols-2">
        {ANALYSIS_FIELD_CONFIG.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {label}
            </label>
            <textarea
              value={localAnalysis[key]}
              onChange={(e) => handleAnalysisChange(key, e.target.value)}
              placeholder={placeholder}
              className="h-28 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
