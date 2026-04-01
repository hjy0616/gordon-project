import type { ScenarioDataPoint } from "@/types/treasure-map";

export const SCENARIO_PARAMS = {
  platformBaseYield: 0.08,
  platformMaxYield: 0.12,
  nonPlatformBaseYield: 0.03,
  nonPlatformMinYield: 0.01,
  decayRate: 0.05,
  adoptionGrowthFactor: 0.02,
  projectionYears: 20,
} as const;

export function computeScenarioData(
  adoptionRate: number,
  haasBonus: number = 0,
): ScenarioDataPoint[] {
  const {
    platformBaseYield,
    platformMaxYield,
    nonPlatformBaseYield,
    nonPlatformMinYield,
    decayRate,
    adoptionGrowthFactor,
    projectionYears,
  } = SCENARIO_PARAMS;

  const rate = adoptionRate / 100;
  const data: ScenarioDataPoint[] = [];

  for (let year = 1; year <= projectionYears; year++) {
    const platformYield = Math.min(
      platformMaxYield,
      platformBaseYield + haasBonus + rate * adoptionGrowthFactor * year,
    );

    const nonPlatformYield = Math.max(
      nonPlatformMinYield,
      nonPlatformBaseYield * Math.exp(-decayRate * rate * year),
    );

    data.push({
      year,
      platformYield: Math.round(platformYield * 1000) / 10,
      nonPlatformYield: Math.round(nonPlatformYield * 1000) / 10,
    });
  }

  return data;
}
