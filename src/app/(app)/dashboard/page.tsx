import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DashboardTabs />
    </div>
  );
}
