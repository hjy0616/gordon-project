import { FearGreedSection } from "@/components/dashboard/fear-greed-section";
import { MarketIndicesSection } from "@/components/dashboard/market-indices-section";
import { FinancialIndicatorsSection } from "@/components/dashboard/financial-indicators-section";
import { JunkBondEtfSection } from "@/components/dashboard/junk-bond-etf-section";
import { EmploymentSection } from "@/components/dashboard/employment-section";
import { CollapsibleSection } from "@/components/dashboard/collapsible-section";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";

export default function DashboardPage() {
  return (
    <div className="space-y-8 p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <DashboardLoading>
        {/* 지표 */}
        <CollapsibleSection title="지표" defaultOpen>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FearGreedSection />
            <MarketIndicesSection />
          </div>
          <FinancialIndicatorsSection />
        </CollapsibleSection>

        {/* 정크본드 ETF */}
        <CollapsibleSection title="정크본드 ETF">
          <JunkBondEtfSection />
        </CollapsibleSection>

        {/* 미국 주요 고용데이터 */}
        <CollapsibleSection title="미국 주요 고용데이터">
          <EmploymentSection />
        </CollapsibleSection>
      </DashboardLoading>
    </div>
  );
}
