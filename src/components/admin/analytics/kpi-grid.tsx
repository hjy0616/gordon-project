"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Kpi = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  target: number | null;
  targetDate: string | null;
  startValue: number | null;
  unit: "percent" | "count" | "minute" | string;
  period: "daily" | "weekly" | "monthly" | string;
  currentValue: number | null;
  lastComputedAt: string | null;
  createdAt: string;
  isAuto: boolean;
};

type KpisResponse = { kpis: Kpi[] };

async function fetchKpis(): Promise<KpisResponse> {
  const res = await fetch("/api/admin/analytics/kpis");
  if (!res.ok) return { kpis: [] };
  return res.json();
}

export function KpiGrid() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "kpis"],
    queryFn: fetchKpis,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (body: Partial<Kpi> & { key: string; name: string }) => {
      const res = await fetch("/api/admin/analytics/kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: string } | null;
        return Promise.reject(new Error(e?.error ?? "생성 실패"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "kpis"] });
      setCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (body: Partial<Kpi> & { id: string }) => {
      const res = await fetch("/api/admin/analytics/kpis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: string } | null;
        return Promise.reject(new Error(e?.error ?? "수정 실패"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "kpis"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/analytics/kpis?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) return Promise.reject(new Error("삭제 실패"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "analytics", "kpis"] });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  const allKpis = data?.kpis ?? [];
  const autoKpis = allKpis.filter((k) => k.isAuto);
  const userKpis = allKpis.filter((k) => !k.isAuto);

  const renderCard = (kpi: Kpi) =>
    editingId === kpi.id ? (
      <KpiEditCard
        key={kpi.id}
        kpi={kpi}
        onCancel={() => setEditingId(null)}
        onSubmit={(body) => updateMutation.mutate({ id: kpi.id, ...body })}
        submitting={updateMutation.isPending}
        error={updateMutation.error?.message ?? null}
      />
    ) : (
      <KpiCard
        key={kpi.id}
        kpi={kpi}
        onEdit={() => setEditingId(kpi.id)}
        onDelete={() => {
          if (confirm(`"${kpi.name}" KPI를 삭제할까요?`)) {
            deleteMutation.mutate(kpi.id);
          }
        }}
      />
    );

  return (
    <div className="flex flex-col gap-8">
      {autoKpis.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">자동 KPI</h3>
            <p className="text-xs text-muted-foreground">
              시스템이 5분마다 자동으로 갱신합니다. 이름·목표값만 수정 가능합니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {autoKpis.map(renderCard)}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">사용자 정의 KPI</h3>
            <p className="text-xs text-muted-foreground">
              직접 입력하는 KPI 입니다. 자유롭게 추가·수정·삭제 가능합니다.
            </p>
          </div>
          <Button onClick={() => setCreating(true)} size="sm" disabled={creating}>
            <Plus className="size-4" /> KPI 추가
          </Button>
        </div>

        {creating && (
          <KpiCreateForm
            onCancel={() => setCreating(false)}
            onSubmit={(body) => createMutation.mutate(body)}
            submitting={createMutation.isPending}
            error={createMutation.error?.message ?? null}
          />
        )}

        {userKpis.length === 0 && !creating ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              아직 사용자 정의 KPI 가 없습니다 — &quot;KPI 추가&quot; 버튼으로 첫 KPI 를 만들어보세요.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userKpis.map(renderCard)}
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  kpi,
  onEdit,
  onDelete,
}: {
  kpi: Kpi;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress =
    kpi.target && kpi.target > 0 && kpi.currentValue !== null
      ? Math.min(1, kpi.currentValue / kpi.target)
      : 0;
  const unitSuffix =
    kpi.unit === "percent" ? "%" : kpi.unit === "minute" ? "분" : "";

  // Milestone — createdAt(시작 시점) → targetDate(목표 시점) 사이의 진행률 vs 값 진행률 비교
  // Date.now()는 impure이라 useEffect에서 분 단위로 동기화 (첫 동기화는 마이크로태스크로 미뤄 cascading render 회피)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const milestone = useMemo(() => {
    if (!kpi.targetDate || kpi.target === null || now === null) return null;
    const target = kpi.target;
    const start = kpi.startValue ?? 0;
    const startTime = new Date(kpi.createdAt).getTime();
    const targetTime = new Date(kpi.targetDate).getTime();
    const daysLeft = Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24));

    let onPace: boolean | null = null;
    if (kpi.currentValue !== null && targetTime > startTime && target !== start) {
      const timeProgress = Math.min(
        1,
        Math.max(0, (now - startTime) / (targetTime - startTime)),
      );
      const valueProgress = Math.min(
        1,
        Math.max(0, (kpi.currentValue - start) / (target - start)),
      );
      onPace = valueProgress >= timeProgress;
    }
    return { daysLeft, onPace };
  }, [
    kpi.targetDate,
    kpi.target,
    kpi.startValue,
    kpi.currentValue,
    kpi.createdAt,
    now,
  ]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <CardTitle className="truncate text-sm font-medium">{kpi.name}</CardTitle>
            {kpi.isAuto && (
              <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                자동
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {kpi.key} · {kpi.period}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          {!kpi.isAuto && (
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {kpi.currentValue !== null ? kpi.currentValue : "—"}
          </span>
          {kpi.target !== null && (
            <span className="text-xs text-muted-foreground">
              / 목표 {kpi.target}
              {unitSuffix}
            </span>
          )}
        </div>
        {kpi.target !== null && kpi.target > 0 && (
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        )}
        {milestone && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              마일스톤: {new Date(kpi.targetDate as string).toLocaleDateString("ko-KR")}
              {milestone.daysLeft >= 0
                ? ` · D-${milestone.daysLeft}`
                : ` · ${Math.abs(milestone.daysLeft)}일 경과`}
            </span>
            {milestone.onPace !== null && (
              <span
                className={
                  milestone.onPace
                    ? "rounded bg-green-500/15 px-1.5 py-0.5 font-medium text-green-600 dark:text-green-400"
                    : "rounded bg-orange-500/15 px-1.5 py-0.5 font-medium text-orange-600 dark:text-orange-400"
                }
              >
                {milestone.onPace ? "On pace" : "Behind"}
              </span>
            )}
          </div>
        )}
        {kpi.description && (
          <p className="mt-2 text-xs text-muted-foreground">{kpi.description}</p>
        )}
        {kpi.lastComputedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            업데이트: {new Date(kpi.lastComputedAt).toLocaleString("ko-KR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function KpiCreateForm({
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  onCancel: () => void;
  onSubmit: (body: {
    key: string;
    name: string;
    target: number | null;
    targetDate: string | null;
    startValue: number | null;
    unit: string;
    period: string;
  }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [startValue, setStartValue] = useState("");
  const [unit, setUnit] = useState("percent");
  const [period, setPeriod] = useState("monthly");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">새 KPI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="kpi-key">key (a-z 0-9 _ 만)</Label>
            <Input
              id="kpi-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="d7_retention"
            />
          </div>
          <div>
            <Label htmlFor="kpi-name">이름</Label>
            <Input
              id="kpi-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="D7 리텐션"
            />
          </div>
          <div>
            <Label htmlFor="kpi-target">목표값</Label>
            <Input
              id="kpi-target"
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="30"
            />
          </div>
          <div>
            <Label htmlFor="kpi-target-date">마일스톤(목표 일자)</Label>
            <Input
              id="kpi-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="kpi-start-value">시작값 (선택)</Label>
            <Input
              id="kpi-start-value"
              type="number"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="kpi-unit">단위</Label>
            <select
              id="kpi-unit"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="percent">% (percent)</option>
              <option value="count">건수 (count)</option>
              <option value="minute">분 (minute)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="kpi-period">주기</Label>
            <select
              id="kpi-period"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="daily">일별</option>
              <option value="weekly">주별</option>
              <option value="monthly">월별</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            <X className="size-4" /> 취소
          </Button>
          <Button
            size="sm"
            disabled={submitting || !key || !name}
            onClick={() => {
              const targetNum = target ? Number(target) : null;
              const startNum = startValue ? Number(startValue) : null;
              onSubmit({
                key,
                name,
                target: Number.isFinite(targetNum) ? (targetNum as number) : null,
                targetDate: targetDate || null,
                startValue: Number.isFinite(startNum) ? (startNum as number) : null,
                unit,
                period,
              });
            }}
          >
            <Check className="size-4" /> 생성
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiEditCard({
  kpi,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  kpi: Kpi;
  onCancel: () => void;
  onSubmit: (body: Partial<Kpi>) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(kpi.name);
  const [target, setTarget] = useState(kpi.target?.toString() ?? "");
  const [targetDate, setTargetDate] = useState(
    kpi.targetDate ? kpi.targetDate.slice(0, 10) : "",
  );
  const [startValue, setStartValue] = useState(kpi.startValue?.toString() ?? "");
  const [currentValue, setCurrentValue] = useState(kpi.currentValue?.toString() ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
          <span className="truncate">{kpi.key}</span>
          {kpi.isAuto && (
            <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              자동
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor={`edit-name-${kpi.id}`}>이름</Label>
          <Input
            id={`edit-name-${kpi.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`edit-target-${kpi.id}`}>목표값</Label>
          <Input
            id={`edit-target-${kpi.id}`}
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`edit-target-date-${kpi.id}`}>마일스톤(목표 일자)</Label>
          <Input
            id={`edit-target-date-${kpi.id}`}
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`edit-start-${kpi.id}`}>시작값 (선택)</Label>
          <Input
            id={`edit-start-${kpi.id}`}
            type="number"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`edit-current-${kpi.id}`}>현재값</Label>
          <Input
            id={`edit-current-${kpi.id}`}
            type="number"
            value={currentValue}
            disabled={kpi.isAuto}
            onChange={(e) => setCurrentValue(e.target.value)}
          />
          {kpi.isAuto && (
            <p className="mt-1 text-xs text-muted-foreground">
              자동 계산되는 KPI 입니다 — 5분마다 자동 갱신됩니다.
            </p>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
            <X className="size-4" /> 취소
          </Button>
          <Button
            size="sm"
            disabled={submitting}
            onClick={() => {
              const targetNum = target ? Number(target) : null;
              const startNum = startValue ? Number(startValue) : null;
              const body: Partial<Kpi> = {
                name,
                target: Number.isFinite(targetNum) ? (targetNum as number) : null,
                targetDate: targetDate || null,
                startValue: Number.isFinite(startNum) ? (startNum as number) : null,
              };
              if (!kpi.isAuto) {
                const currentNum = currentValue ? Number(currentValue) : null;
                body.currentValue = Number.isFinite(currentNum)
                  ? (currentNum as number)
                  : null;
              }
              onSubmit(body);
            }}
          >
            <Check className="size-4" /> 저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
