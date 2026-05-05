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

/**
 * Load and cache the Korean districts GeoJSON. Used for client-side point-in-polygon
 * matching (independent of MapLibre's viewport — works for offscreen districts).
 */
let geojsonCache: GeoJSON.FeatureCollection | null = null;
let geojsonInflight: Promise<GeoJSON.FeatureCollection | null> | null = null;
export function loadKoreaDistrictsGeoJSON(): Promise<GeoJSON.FeatureCollection | null> {
  if (geojsonCache) return Promise.resolve(geojsonCache);
  if (geojsonInflight) return geojsonInflight;
  geojsonInflight = fetch("/data/korea-districts.geojson")
    .then((r) => (r.ok ? r.json() : null))
    .then((data: GeoJSON.FeatureCollection | null) => {
      if (data) geojsonCache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      geojsonInflight = null;
    });
  return geojsonInflight;
}

/** Ray-casting point-in-polygon. polygon is a ring (closed or open). */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(
  lng: number,
  lat: number,
  geom: GeoJSON.Geometry,
): boolean {
  if (geom.type === "Polygon") {
    if (!pointInRing(lng, lat, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (pointInRing(lng, lat, geom.coordinates[i])) return false; // hole
    }
    return true;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (!pointInRing(lng, lat, poly[0])) continue;
      let inHole = false;
      for (let i = 1; i < poly.length; i++) {
        if (pointInRing(lng, lat, poly[i])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/**
 * Find the matching administrative district id for a (lat, lng).
 * Returns null if no feature contains the point. Pure data lookup — does not depend on
 * MapLibre viewport, source readiness, or render state.
 */
export function findMatchingDistrictId(
  lat: number,
  lng: number,
  geojson: GeoJSON.FeatureCollection,
): string | null {
  for (const feature of geojson.features) {
    if (!feature.geometry) continue;
    if (pointInGeometry(lng, lat, feature.geometry)) {
      const id = feature.properties?.id ?? feature.id;
      if (typeof id === "string") return id;
    }
  }
  return null;
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
