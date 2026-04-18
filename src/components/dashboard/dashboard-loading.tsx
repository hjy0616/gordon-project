"use client";

import { Loader2 } from "lucide-react";
import { useFearGreedIndex } from "@/lib/queries/use-fear-greed";
import { useMarketIndices } from "@/lib/queries/use-market-indices";
import { useYahooIndicators } from "@/lib/queries/use-yahoo-indicators";
import { useFredIndicators } from "@/lib/queries/use-fred";
import { useJunkBondEtf } from "@/lib/queries/use-junk-bond-etf";
import { useEmployment } from "@/lib/queries/use-employment";

export function DashboardLoading({ children }: { children: React.ReactNode }) {
  const { isFetching: fgFetching } = useFearGreedIndex();
  const { isFetching: miFetching } = useMarketIndices();
  const { isFetching: yahooFetching } = useYahooIndicators();
  const { isFetching: fredFetching } = useFredIndicators();
  const { isFetching: junkFetching } = useJunkBondEtf();
  const { isFetching: empFetching } = useEmployment();

  const isFetching = fgFetching || miFetching || yahooFetching || fredFetching || junkFetching || empFetching;

  return (
    <div className="relative">
      {children}
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">데이터를 불러오는 중...</span>
          </div>
        </div>
      )}
    </div>
  );
}
