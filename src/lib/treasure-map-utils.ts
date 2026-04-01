import { DISTRICT_MAP } from "@/data/mock-korean-districts";
import type {
  KoreanDistrict,
  CustomDistrict,
  DistrictOverrides,
} from "@/types/treasure-map";

/**
 * Resolve a single district by ID.
 * Priority: custom district → mock district (with overrides applied).
 */
export function resolveDistrict(
  id: string,
  customDistricts: CustomDistrict[],
  districtOverrides: Record<string, DistrictOverrides>,
): KoreanDistrict | CustomDistrict | null {
  // Check custom districts first
  const custom = customDistricts.find((d) => d.id === id);
  if (custom) return custom;

  // Check mock districts
  const mock = DISTRICT_MAP.get(id);
  if (!mock) return null;

  // Apply overrides if any
  const overrides = districtOverrides[id];
  if (!overrides) return mock;

  return applyOverrides(mock, overrides);
}

/**
 * Get all districts: mock (minus deleted, plus overrides) + custom.
 * Sorted by tier priority then name.
 */
export function getAllDistricts(
  customDistricts: CustomDistrict[],
  districtOverrides: Record<string, DistrictOverrides>,
  deletedMockIds: string[],
): (KoreanDistrict | CustomDistrict)[] {
  const deletedSet = new Set(deletedMockIds);

  const mockDistricts: KoreanDistrict[] = [];
  for (const [id, district] of DISTRICT_MAP) {
    if (deletedSet.has(id)) continue;
    const overrides = districtOverrides[id];
    mockDistricts.push(overrides ? applyOverrides(district, overrides) : district);
  }

  return [...mockDistricts, ...customDistricts];
}

/** Check if a district is custom (user-created) */
export function isCustomDistrict(
  district: KoreanDistrict | CustomDistrict,
): district is CustomDistrict {
  return "isCustom" in district && district.isCustom === true;
}

/** Apply partial overrides to a mock district */
function applyOverrides(
  mock: KoreanDistrict,
  overrides: DistrictOverrides,
): KoreanDistrict {
  return {
    ...mock,
    ...(overrides.name_ko !== undefined && { name_ko: overrides.name_ko }),
    ...(overrides.name_en !== undefined && { name_en: overrides.name_en }),
    ...(overrides.region !== undefined && { region: overrides.region }),
    ...(overrides.tier !== undefined && { tier: overrides.tier }),
    ...(overrides.tierReason !== undefined && {
      tierReason: overrides.tierReason,
    }),
    ...(overrides.criteria && {
      criteria: { ...mock.criteria, ...overrides.criteria },
    }),
  };
}
