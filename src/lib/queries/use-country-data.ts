import { useQuery } from "@tanstack/react-query";
import { FALLBACK_COUNTRIES } from "@/data/static-fallback";
import { DEFAULT_COUNTRY_DETAILS } from "@/data/mock-country-details";
import type { CountryIndicators, CountryEditableData } from "@/types/macro-map";

type MockCountryData = Omit<CountryEditableData, "core_capabilities">;

interface IndicatorsResponse {
  data: CountryIndicators[];
  updatedAt: string;
  source: "worldbank" | "fallback";
}

interface DetailsResponse {
  data: Record<string, MockCountryData>;
  updatedAt: string;
  source: "worldbank" | "fallback";
}

const FALLBACK_INDICATORS: IndicatorsResponse = {
  data: FALLBACK_COUNTRIES,
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

const FALLBACK_DETAILS: DetailsResponse = {
  data: DEFAULT_COUNTRY_DETAILS,
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

/**
 * 30개국 기본 거시경제 지표를 가져온다.
 * - staleTime 24h (경제 데이터는 자주 변하지 않음)
 * - placeholderData로 fallback 제공 → 로딩 중에도 UI 깨지지 않음
 */
export function useCountryIndicators() {
  return useQuery<IndicatorsResponse>({
    queryKey: ["country-indicators"],
    queryFn: async () => {
      const res = await fetch("/api/world-bank/indicators");
      if (!res.ok) return FALLBACK_INDICATORS;
      return res.json();
    },
    placeholderData: FALLBACK_INDICATORS,
  });
}

/**
 * 30개국 상세 경제 데이터를 가져온다.
 */
export function useCountryDetails() {
  return useQuery<DetailsResponse>({
    queryKey: ["country-details"],
    queryFn: async () => {
      const res = await fetch("/api/world-bank/details");
      if (!res.ok) return FALLBACK_DETAILS;
      return res.json();
    },
    placeholderData: FALLBACK_DETAILS,
  });
}
