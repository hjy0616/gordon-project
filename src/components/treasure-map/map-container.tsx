"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import { useTheme } from "next-themes";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { TIER_COLORS } from "@/types/treasure-map";
import {
  loadKoreaDistrictsGeoJSON,
  findMatchingDistrictId,
} from "@/lib/treasure-map-utils";
import { reverseGeocode, parseKoreanAddress } from "@/lib/nominatim";
import { MapSearchBar } from "./map-search-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchResultItem } from "@/hooks/use-nominatim-search";

const MAP_STYLES = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/bright",
};

const GEOJSON_URL = "/data/korea-districts.geojson";

/** Find first symbol layer to insert district layers below it */
function findLabelLayerId(map: maplibregl.Map): string | undefined {
  const style = map.getStyle();
  if (!style?.layers) return undefined;
  for (const layer of style.layers) {
    if (layer.type === "symbol") {
      return layer.id;
    }
  }
  return undefined;
}

import { fetchStyle } from "@/lib/map-style-utils";

function defaultFillColorExpression(): maplibregl.ExpressionSpecification {
  return [
    "match",
    ["get", "tier"],
    "HIGHEST",
    TIER_COLORS.HIGHEST,
    "HIGH",
    TIER_COLORS.HIGH,
    "MEDIUM",
    TIER_COLORS.MEDIUM,
    "MODERATE",
    TIER_COLORS.MODERATE,
    "#757575",
  ];
}

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const currentThemeRef = useRef<string | undefined>(undefined);
  const hoveredIdRef = useRef<string | number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const draftMarkerRef = useRef<maplibregl.Marker | null>(null);
  // Re-render trigger for effects that depend on the GeoJSON layer being live.
  // readyRef alone is a ref so it can't drive React; we bump readyTick whenever it flips so
  // hydrated customDistricts get re-evaluated for auto-match and polygon coloring.
  const [readyTick, setReadyTick] = useState(0);
  const { resolvedTheme } = useTheme();

  const isMobile = useIsMobile();
  const selectedDistrict = useTreasureMapStore((s) => s.selectedDistrict);
  const customDistricts = useTreasureMapStore((s) => s.customDistricts);
  const deletedMockIds = useTreasureMapStore((s) => s.deletedMockIds);
  const panelMode = useTreasureMapStore((s) => s.panelMode);
  const createStep = useTreasureMapStore((s) => s.createStep);

  const addCustomLayers = useCallback((map: maplibregl.Map) => {
    if (map.getSource("korea-districts")) return;

    const beforeId = findLabelLayerId(map);
    const isDark = currentThemeRef.current === "dark";

    // -- District source --
    map.addSource("korea-districts", {
      type: "geojson",
      data: GEOJSON_URL,
      promoteId: "id",
    });

    // -- Fill layer --
    // Default fill-color (tier-based). Custom polygon colors are applied via setPaintProperty in a separate effect.
    map.addLayer(
      {
        id: "districts-fill",
        type: "fill",
        source: "korea-districts",
        paint: {
          "fill-color": defaultFillColorExpression(),
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.85,
            0.6,
          ],
        },
      },
      beforeId,
    );

    // -- Border layer --
    map.addLayer(
      {
        id: "districts-border",
        type: "line",
        source: "korea-districts",
        paint: {
          "line-color": isDark
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.15)",
          "line-width": 0.5,
        },
      },
      beforeId,
    );

    // -- Highlight layer --
    map.addLayer(
      {
        id: "districts-highlight",
        type: "line",
        source: "korea-districts",
        paint: {
          "line-color": "#FFFFFF",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            ["boolean", ["feature-state", "hover"], false],
            2,
            0,
          ],
        },
      },
      beforeId,
    );

    // -- Custom-district fallback rectangles --
    // For unmatched custom districts (no行政구역 polygon match), draw a small square
    // colored area at the lng/lat instead of a pin marker. Data is pushed via setData in a
    // separate effect that watches customDistricts.
    map.addSource("custom-rects", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "id",
    });

    map.addLayer(
      {
        id: "custom-rects-fill",
        type: "fill",
        source: "custom-rects",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.85,
            0.6,
          ],
        },
      },
      beforeId,
    );

    map.addLayer(
      {
        id: "custom-rects-border",
        type: "line",
        source: "custom-rects",
        paint: {
          "line-color": "#FFFFFF",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            2.5,
            ["boolean", ["feature-state", "hover"], false],
            1.5,
            0.8,
          ],
          "line-opacity": 0.85,
        },
      },
      beforeId,
    );

    readyRef.current = true;
    // Notify dependent effects (auto-match, paint coloring) so they re-run for already-hydrated districts.
    setReadyTick((t) => t + 1);
  }, []);

  // -- Apply custom polygon coloring (matched districts) --
  // Declared before the theme-change effect so it's already in scope when that effect's deps array is evaluated.
  // Color contract: `color: null` means "use the custom district's tier color" (NOT the polygon's GeoJSON tier).
  // That keeps legacy/API rows with matchedDistrictId but no chosen color visually correct.
  const applyCustomColoring = useCallback(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getLayer("districts-fill")) return;

    const matched = customDistricts.filter(
      (d): d is typeof d & { matchedDistrictId: string } => !!d.matchedDistrictId,
    );

    if (matched.length === 0) {
      map.setPaintProperty(
        "districts-fill",
        "fill-color",
        defaultFillColorExpression(),
      );
      return;
    }

    const matchPairs: (string | string[])[] = [];
    for (const d of matched) {
      const effectiveColor = d.color ?? TIER_COLORS[d.tier];
      matchPairs.push(d.matchedDistrictId, effectiveColor);
    }

    const expr: unknown = [
      "match",
      ["get", "id"],
      ...matchPairs,
      defaultFillColorExpression(),
    ];
    map.setPaintProperty(
      "districts-fill",
      "fill-color",
      expr as maplibregl.ExpressionSpecification,
    );
    // readyTick is intentionally a dep so this re-runs once the layer becomes live (hydrate-race fix).
  }, [customDistricts, readyTick]);

  // -- Map initialization --
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    const theme = resolvedTheme ?? "dark";
    currentThemeRef.current = theme;
    const styleUrl =
      theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;

    fetchStyle(styleUrl).then((style) => {
      if (cancelled || !containerRef.current) return;
      initMap(containerRef.current, style);
    });

    function initMap(
      container: HTMLDivElement,
      style: maplibregl.StyleSpecification,
    ) {
      const map = new maplibregl.Map({
        container,
        style,
        center: [127.5, 36.5],
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      // Suppress missing sprite image warnings from basemap
      map.on("styleimagemissing", (e) => {
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });

      map.on("load", () => {
        addCustomLayers(map);
      });

      // -- Hover --
      map.on("mousemove", "districts-fill", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const id = e.features[0].properties?.id;
        if (hoveredIdRef.current && hoveredIdRef.current !== id) {
          map.setFeatureState(
            { source: "korea-districts", id: hoveredIdRef.current },
            { hover: false },
          );
        }
        if (id) {
          hoveredIdRef.current = id;
          map.setFeatureState(
            { source: "korea-districts", id },
            { hover: true },
          );
          useTreasureMapStore.getState().setHoveredDistrict(id as string);
        }
      });

      map.on("mouseleave", "districts-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredIdRef.current) {
          map.setFeatureState(
            { source: "korea-districts", id: hoveredIdRef.current },
            { hover: false },
          );
          hoveredIdRef.current = null;
          useTreasureMapStore.getState().setHoveredDistrict(null);
        }
      });

      // -- District click --
      map.on("click", "districts-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        const featureId = props?.id as string;
        if (!featureId) return;

        const st = useTreasureMapStore.getState();

        // If a custom district is matched to this polygon, prefer the custom id for the panel
        const matchedCustom = st.customDistricts.find(
          (c) => c.matchedDistrictId === featureId,
        );
        const panelId = matchedCustom ? matchedCustom.id : featureId;

        // Selection feature-state is driven by the GeoJSON feature id (the selection-sync effect handles cleanup)
        st.selectDistrict(panelId);

        // Fly to clicked location
        map.flyTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: 11,
          duration: 800,
        });
      });

      // -- Custom-rect (unmatched fallback) click --
      map.on("click", "custom-rects-fill", (e) => {
        if (!e.features?.length) return;
        const districtId = e.features[0].properties?.id as string | undefined;
        if (!districtId) return;
        useTreasureMapStore.getState().selectDistrict(districtId);
        map.flyTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: 12,
          duration: 800,
        });
      });

      // -- Custom-rect hover --
      const customRectHoverIdRef = { current: null as string | null };
      map.on("mousemove", "custom-rects-fill", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const id = e.features[0].properties?.id as string | undefined;
        if (
          customRectHoverIdRef.current &&
          customRectHoverIdRef.current !== id
        ) {
          map.setFeatureState(
            { source: "custom-rects", id: customRectHoverIdRef.current },
            { hover: false },
          );
        }
        if (id) {
          customRectHoverIdRef.current = id;
          map.setFeatureState(
            { source: "custom-rects", id },
            { hover: true },
          );
        }
      });
      map.on("mouseleave", "custom-rects-fill", () => {
        map.getCanvas().style.cursor = "";
        if (customRectHoverIdRef.current) {
          map.setFeatureState(
            { source: "custom-rects", id: customRectHoverIdRef.current },
            { hover: false },
          );
          customRectHoverIdRef.current = null;
        }
      });

      // -- Empty area click --
      map.on("click", (e) => {
        if (!readyRef.current || !map.getLayer("districts-fill")) return;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["districts-fill", "custom-rects-fill"],
        });
        if (!features.length) {
          if (selectedIdRef.current) {
            map.setFeatureState(
              { source: "korea-districts", id: selectedIdRef.current },
              { selected: false },
            );
            selectedIdRef.current = null;
          }
          useTreasureMapStore.getState().selectDistrict(null);
        }
      });

      mapRef.current = map;
    }

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Theme change --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !resolvedTheme) return;
    if (resolvedTheme === currentThemeRef.current) return;
    currentThemeRef.current = resolvedTheme;
    readyRef.current = false;

    const styleUrl =
      resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
    fetchStyle(styleUrl).then((style) => {
      if (!mapRef.current) return;
      mapRef.current.setStyle(style);
      mapRef.current.once("style.load", () => {
        if (!mapRef.current) return;
        addCustomLayers(mapRef.current);
        // Re-apply custom polygon coloring after style swap (addCustomLayers resets fill-color to default)
        applyCustomColoring();
      });
    });
  }, [resolvedTheme, addCustomLayers, applyCustomColoring]);

  // -- Sync selected feature-state from store --
  // selectedDistrict can be: a mock district id (== korea-districts feature id), a matched custom
  // district (use matchedDistrictId on korea-districts), or an unmatched custom district (drive
  // selected state on the custom-rects source instead).
  const selectedRectIdRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Clear previous selections from both sources
    if (selectedIdRef.current) {
      map.setFeatureState(
        { source: "korea-districts", id: selectedIdRef.current },
        { selected: false },
      );
      selectedIdRef.current = null;
    }
    if (selectedRectIdRef.current) {
      map.setFeatureState(
        { source: "custom-rects", id: selectedRectIdRef.current },
        { selected: false },
      );
      selectedRectIdRef.current = null;
    }

    if (!selectedDistrict) return;

    const customMatch = customDistricts.find((c) => c.id === selectedDistrict);
    if (customMatch) {
      if (customMatch.matchedDistrictId) {
        // Matched: highlight the real korea-districts polygon
        map.setFeatureState(
          { source: "korea-districts", id: customMatch.matchedDistrictId },
          { selected: true },
        );
        selectedIdRef.current = customMatch.matchedDistrictId;
      } else {
        // Unmatched: highlight the fallback rectangle
        map.setFeatureState(
          { source: "custom-rects", id: customMatch.id },
          { selected: true },
        );
        selectedRectIdRef.current = customMatch.id;
      }
    } else {
      // Mock district id (matches a korea-districts feature id directly)
      map.setFeatureState(
        { source: "korea-districts", id: selectedDistrict },
        { selected: true },
      );
      selectedIdRef.current = selectedDistrict;
    }
  }, [selectedDistrict, customDistricts]);

  // -- Custom district unmatched fallback rectangles --
  // Matched districts are painted via applyCustomColoring on the korea-districts polygon.
  // Unmatched districts get a small ~500m square colored area centered on their lng/lat,
  // pushed into the custom-rects GeoJSON source. No DOM markers anywhere — the rectangle is
  // a real map feature so it pans/zooms with the rest of the map and can't drift from the cursor.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const source = map.getSource("custom-rects") as
      | maplibregl.GeoJSONSource
      | undefined;
    if (!source) return;

    // Half-extents in degrees: ~3km at Korean latitudes (구·읍·면 단위 영역 크기).
    const HALF_LAT = 0.027;
    const HALF_LNG = 0.034;

    const features: GeoJSON.Feature[] = customDistricts
      .filter((d) => !d.matchedDistrictId)
      .map((d) => {
        const color = d.color ?? TIER_COLORS[d.tier];
        return {
          type: "Feature",
          id: d.id,
          properties: { id: d.id, color },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [d.lng - HALF_LNG, d.lat - HALF_LAT],
                [d.lng + HALF_LNG, d.lat - HALF_LAT],
                [d.lng + HALF_LNG, d.lat + HALF_LAT],
                [d.lng - HALF_LNG, d.lat + HALF_LAT],
                [d.lng - HALF_LNG, d.lat - HALF_LAT],
              ],
            ],
          },
        };
      });

    source.setData({ type: "FeatureCollection", features });

    // Clean up any DOM markers from earlier versions (no-op once this code has been live).
    for (const [, marker] of markersRef.current) marker.remove();
    markersRef.current.clear();
  }, [customDistricts, readyTick]);

  useEffect(() => {
    applyCustomColoring();
  }, [applyCustomColoring]);

  // -- Backfill matchedDistrictId for legacy/hydrated districts that don't have one yet --
  // New districts created via the form already arrive with matchedDistrictId computed up-front
  // (see district-create-form.handleSubmit), so this effect only runs for legacy rows hydrated
  // from the DB without a match. Uses GeoJSON ray-casting — independent of viewport, so offscreen
  // districts (especially on mobile) are matched too.
  useEffect(() => {
    const candidates = customDistricts.filter(
      (d) => d.matchedDistrictId === null,
    );
    if (candidates.length === 0) return;

    let cancelled = false;
    (async () => {
      const geojson = await loadKoreaDistrictsGeoJSON();
      if (cancelled || !geojson) return;

      for (const district of candidates) {
        // Live re-check in case the user already deleted/edited it during the await.
        const live = useTreasureMapStore
          .getState()
          .customDistricts.find((d) => d.id === district.id);
        if (!live || live.matchedDistrictId !== null) continue;

        const matchedId = findMatchingDistrictId(
          district.lat,
          district.lng,
          geojson,
        );
        if (!matchedId) continue;

        // store.updateCustomDistrict handles both local state and the PUT to /api/treasure-map/districts.
        // The legacy row already exists server-side (it came from a GET), so there's no POST/PUT race here.
        useTreasureMapStore
          .getState()
          .updateCustomDistrict(district.id, { matchedDistrictId: matchedId });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customDistricts]);

  // -- Filter deleted mock districts from GeoJSON layers --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const layers = ["districts-fill", "districts-border", "districts-highlight"];
    const filter =
      deletedMockIds.length > 0
        ? ["!", ["in", ["get", "id"], ["literal", deletedMockIds]]]
        : null;

    for (const layerId of layers) {
      if (!map.getLayer(layerId)) continue;
      if (filter) {
        map.setFilter(layerId, filter as maplibregl.FilterSpecification);
      } else {
        map.setFilter(layerId, null);
      }
    }
  }, [deletedMockIds]);

  // -- Handle search result selection --
  const handleSearchSelect = useCallback((result: SearchResultItem) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing draft marker
    if (draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }

    const { setCreateDraft } = useTreasureMapStore.getState();

    // Create draggable marker
    const marker = new maplibregl.Marker({
      draggable: true,
      color: "#f97316",
    })
      .setLngLat([result.lng, result.lat])
      .addTo(map);

    // Handle dragend → reverse geocode
    marker.on("dragend", async () => {
      const lngLat = marker.getLngLat();
      const st = useTreasureMapStore.getState();
      const draft = st.createDraft;

      // Update coords immediately
      st.setCreateDraft({
        lat: lngLat.lat,
        lng: lngLat.lng,
        region: draft?.region ?? "",
        searchQuery: draft?.searchQuery ?? "",
      });

      // Reverse geocode
      try {
        const res = await reverseGeocode(lngLat.lat, lngLat.lng);
        if (res) {
          const region = parseKoreanAddress(res.address);
          const current = useTreasureMapStore.getState().createDraft;
          if (current) {
            useTreasureMapStore.getState().setCreateDraft({
              ...current,
              region,
            });
          }
        }
      } catch {
        const current = useTreasureMapStore.getState().createDraft;
        if (current) {
          useTreasureMapStore.getState().setCreateDraft({
            ...current,
            region: "주소 조회 실패",
          });
        }
      }
    });

    draftMarkerRef.current = marker;

    // Update store
    setCreateDraft({
      lat: result.lat,
      lng: result.lng,
      region: result.region,
      searchQuery: result.region,
    });

    // Fly to location
    map.flyTo({
      center: [result.lng, result.lat],
      zoom: 13,
      duration: 800,
    });
  }, []);

  // -- Cleanup draft marker when leaving create mode --
  useEffect(() => {
    if (panelMode !== "create" && draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }
  }, [panelMode]);

  // Desktop: show search bar in create mode
  // Mobile: show search bar only in create locate step
  const showSearchBar = isMobile
    ? panelMode === "create" && createStep === "locate"
    : panelMode === "create";

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {showSearchBar && <MapSearchBar onSelect={handleSearchSelect} />}
    </div>
  );
}
