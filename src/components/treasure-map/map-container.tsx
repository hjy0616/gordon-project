"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { useTheme } from "next-themes";
import { useTreasureMapStore } from "@/lib/stores/treasure-map-store";
import { TIER_COLORS } from "@/types/treasure-map";
import { reverseGeocode, parseKoreanAddress } from "@/lib/nominatim";
import { MapSearchBar } from "./map-search-bar";
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

export function MapContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);
  const currentThemeRef = useRef<string | undefined>(undefined);
  const hoveredIdRef = useRef<string | number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const draftMarkerRef = useRef<maplibregl.Marker | null>(null);
  const { resolvedTheme } = useTheme();

  const selectedDistrict = useTreasureMapStore((s) => s.selectedDistrict);
  const customDistricts = useTreasureMapStore((s) => s.customDistricts);
  const deletedMockIds = useTreasureMapStore((s) => s.deletedMockIds);
  const panelMode = useTreasureMapStore((s) => s.panelMode);

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
    map.addLayer(
      {
        id: "districts-fill",
        type: "fill",
        source: "korea-districts",
        paint: {
          "fill-color": [
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
          ],
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

    readyRef.current = true;
  }, []);

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
        const id = props?.id as string;
        if (!id) return;

        const st = useTreasureMapStore.getState();

        // Clear previous selection feature state
        if (selectedIdRef.current) {
          map.setFeatureState(
            { source: "korea-districts", id: selectedIdRef.current },
            { selected: false },
          );
        }

        // Set new selection
        selectedIdRef.current = id;
        map.setFeatureState(
          { source: "korea-districts", id },
          { selected: true },
        );
        st.selectDistrict(id);

        // Fly to clicked location
        map.flyTo({
          center: [e.lngLat.lng, e.lngLat.lat],
          zoom: 11,
          duration: 800,
        });
      });

      // -- Empty area click --
      map.on("click", (e) => {
        if (!readyRef.current || !map.getLayer("districts-fill")) return;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["districts-fill"],
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
        if (mapRef.current) addCustomLayers(mapRef.current);
      });
    });
  }, [resolvedTheme, addCustomLayers]);

  // -- Sync selected district from store --
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // Clear previous
    if (selectedIdRef.current && selectedIdRef.current !== selectedDistrict) {
      map.setFeatureState(
        { source: "korea-districts", id: selectedIdRef.current },
        { selected: false },
      );
    }

    // Set new
    if (selectedDistrict) {
      map.setFeatureState(
        { source: "korea-districts", id: selectedDistrict },
        { selected: true },
      );
    }

    selectedIdRef.current = selectedDistrict;
  }, [selectedDistrict]);

  // -- Custom district pin markers --
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(customDistricts.map((d) => d.id));

    // Remove markers for districts that no longer exist
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add or update markers for current custom districts
    for (const district of customDistricts) {
      const existing = markersRef.current.get(district.id);
      if (existing) {
        // Update position if changed
        existing.setLngLat([district.lng, district.lat]);
        // Update color
        const el = existing.getElement();
        el.style.background = TIER_COLORS[district.tier];
        continue;
      }

      // Create new marker
      const el = document.createElement("div");
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        background: ${TIER_COLORS[district.tier]};
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.15s;
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.3)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        useTreasureMapStore.getState().selectDistrict(district.id);
        map.flyTo({
          center: [district.lng, district.lat],
          zoom: 11,
          duration: 800,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([district.lng, district.lat])
        .addTo(map);

      markersRef.current.set(district.id, marker);
    }
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

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {panelMode === "create" && (
        <MapSearchBar onSelect={handleSearchSelect} />
      )}
    </div>
  );
}
