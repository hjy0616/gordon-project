import { prisma } from "@/lib/prisma";
import { computeStickiness } from "./analytics/queries/mau";
import { computeStatusChurnRate30d } from "./analytics/queries/status-churn";
import { computeD30Retention } from "./analytics/queries/d30-retention";
import { computeAvgSessionMinutes30d } from "./analytics/queries/avg-session";

export const AUTO_KPI_PREFIX = "kpi:auto:";
export const AUTO_KPI_TTL_MS = 5 * 60 * 1000;

export type AutoKpiUnit = "percent" | "count" | "minute";
export type AutoKpiPeriod = "daily" | "weekly" | "monthly";

export type AutoKpiDef = {
  key: string;
  name: string;
  description: string;
  unit: AutoKpiUnit;
  period: AutoKpiPeriod;
  defaultTarget: number | null;
  compute: () => Promise<number>;
};

export const AUTO_KPIS: AutoKpiDef[] = [
  {
    key: `${AUTO_KPI_PREFIX}stickiness`,
    name: "DAU/MAU Stickiness",
    description:
      "DAU ÷ MAU × 100. 매일 들어오는 유저의 비율. 산업 일반치 20% = 보통, 30%+ = 우수.",
    unit: "percent",
    period: "monthly",
    defaultTarget: 20,
    compute: computeStickiness,
  },
  {
    key: `${AUTO_KPI_PREFIX}status_churn_30d`,
    name: "월 멤버십 이탈률 (status churn)",
    description:
      "ACTIVE 였던 회원이 EXPIRED/SUSPENDED 로 전환된 비율. 결제 취소가 아닌 수동 만료/정지 처리 기반. 산업 일반치 5% 이하 권장.",
    unit: "percent",
    period: "monthly",
    defaultTarget: 5,
    compute: computeStatusChurnRate30d,
  },
  {
    key: `${AUTO_KPI_PREFIX}d30_retention`,
    name: "D30 Retention (가입 후 30일 잔존)",
    description:
      "최근 60일 가입자 중 30일 이상 경과한 cohort 의 D30 잔존율 (총잔존÷총가입, 가중 평균). 가입 30일 시점 활동률.",
    unit: "percent",
    period: "monthly",
    defaultTarget: 30,
    compute: computeD30Retention,
  },
  {
    key: `${AUTO_KPI_PREFIX}avg_session_minutes`,
    name: "평균 세션 시간(분)",
    description: "최근 30일 세션의 평균 체류 시간(분). 사용 측면 지표.",
    unit: "minute",
    period: "monthly",
    defaultTarget: 5,
    compute: computeAvgSessionMinutes30d,
  },
];

const AUTO_KPI_KEYS = new Set(AUTO_KPIS.map((k) => k.key));

export function isAutoKpiKey(key: string): boolean {
  return AUTO_KPI_KEYS.has(key);
}

export function isAutoKpiKeyPrefix(key: string): boolean {
  return key.startsWith(AUTO_KPI_PREFIX);
}

export async function ensureAndRefreshAutoKpis(): Promise<void> {
  const staleCutoff = new Date(Date.now() - AUTO_KPI_TTL_MS);

  // NOTE: AUTO_KPIS 정의에서 빠진 kpi:auto:* row는 DB에서 삭제하지 않는다.
  // GET 요청에서 destructive 행동을 하면 (a) 페이지 한 번 열리는 순간 KPI history 영구 삭제,
  // (b) 임시 deploy/실수로 AUTO_KPIS에서 빠지면 production 데이터 손실 위험.
  // 응답에서 숨기는 작업은 /api/admin/analytics/kpis route GET에서 필터링으로 처리한다.

  await Promise.all(
    AUTO_KPIS.map((def) =>
      prisma.kpi.upsert({
        where: { key: def.key },
        create: {
          key: def.key,
          name: def.name,
          description: def.description,
          unit: def.unit,
          period: def.period,
          target: def.defaultTarget,
        },
        update: {},
      }),
    ),
  );

  const staleRows = await prisma.kpi.findMany({
    where: {
      key: { in: AUTO_KPIS.map((k) => k.key) },
      OR: [{ lastComputedAt: null }, { lastComputedAt: { lt: staleCutoff } }],
    },
    select: { key: true },
  });

  if (staleRows.length === 0) return;

  const staleKeys = new Set(staleRows.map((r) => r.key));
  const tasks = AUTO_KPIS.filter((def) => staleKeys.has(def.key)).map(
    async (def) => {
      const value = await def.compute();
      await prisma.kpi.update({
        where: { key: def.key },
        data: {
          currentValue: Number.isFinite(value) ? value : null,
          lastComputedAt: new Date(),
        },
      });
    },
  );
  await Promise.allSettled(tasks);
}
