import { FearGreedSection } from "@/components/dashboard/fear-greed-section";
import { MarketIndicesSection } from "@/components/dashboard/market-indices-section";
import { FinancialIndicatorsSection } from "@/components/dashboard/financial-indicators-section";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FearGreedSection />
        <MarketIndicesSection />
      </div>
      <FinancialIndicatorsSection />
    </div>
  );
}
