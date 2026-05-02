import { AnalyticsTabs } from "@/components/admin/analytics/analytics-tabs";

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          실시간 / 유저 활동 / 성장 / 리텐션 / 이탈 / 유입 / 참여 / Wow·Pain / KPI
        </p>
      </div>

      <AnalyticsTabs />
    </div>
  );
}
