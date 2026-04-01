const BASE_URL = "https://nominatim.openstreetmap.org";
const USER_AGENT = "GordonProject/1.0";

export interface NominatimAddress {
  state?: string;
  city?: string;
  county?: string;
  city_district?: string;
  quarter?: string;
  suburb?: string;
  neighbourhood?: string;
  country?: string;
}

export interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
}

export interface NominatimReverseResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
}

export function parseKoreanAddress(address: NominatimAddress): string {
  const parts = [
    address.state,
    address.city ?? address.county,
    address.city_district,
    address.quarter ?? address.suburb ?? address.neighbourhood,
  ].filter(Boolean);
  return parts.join(" ") || address.country || "";
}

export async function searchAddress(
  query: string,
): Promise<NominatimSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    countrycodes: "kr",
    addressdetails: "1",
    limit: "5",
    "accept-language": "ko",
  });

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) throw new Error(`Nominatim search failed: ${res.status}`);
  return res.json();
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<NominatimReverseResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "ko",
    zoom: "18",
  });

  const res = await fetch(`${BASE_URL}/reverse?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return null;
  return res.json();
}
