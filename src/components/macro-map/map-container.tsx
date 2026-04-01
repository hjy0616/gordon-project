"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { useTheme } from "next-themes";
import { useMacroMapStore } from "@/lib/stores/macro-map-store";
import { MOCK_COUNTRIES } from "@/data/mock-countries";
import { COUNTRY_CENTROIDS } from "@/data/country-centroids";
import { INDICATOR_CONFIG, type IndicatorType, type CountryRelation, type CapitalFlow } from "@/types/macro-map";

const MAP_STYLES = {
  dark: "https://tiles.openfreemap.org/styles/dark",
  light: "https://tiles.openfreemap.org/styles/bright",
};

const GEOJSON_URL = "/data/countries.geojson";

const RELATION_LAYER_IDS = [
  "relation-lines-ally",
  "relation-lines-rival",
] as const;

function interpolateColor(t: number, colors: [string, string]): string {
  const hex = (s: string) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = hex(colors[0]);
  const [r2, g2, b2] = hex(colors[1]);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

function buildChoroplethExpression(indicator: IndicatorType) {
  const values = MOCK_COUNTRIES.map((c) => c[indicator]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const { colorRange } = INDICATOR_CONFIG[indicator];

  const entries: string[] = [];
  for (const country of MOCK_COUNTRIES) {
    const t = (country[indicator] - min) / range;
    entries.push(
      country.iso_a3,
      interpolateColor(Math.max(0, Math.min(1, t)), colorRange)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ["match", ["get", "ISO_A3"], ...entries, "#1a1a2e"] as any;
}

function generateBezierCurve(
  from: [number, number],
  to: [number, number],
  segments: number = 30
): [number, number][] {
  let [fx] = from;
  const [, fy] = from;
  let [tx] = to;
  const [, ty] = to;

  if (tx - fx > 180) fx += 360;
  else if (fx - tx > 180) tx += 360;

  const midX = (fx + tx) / 2;
  const midY = (fy + ty) / 2;
  const dx = tx - fx;
  const dy = ty - fy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [from, to];
  const latFactor = 1 - Math.abs(midY) / 120;
  const offset = dist * 0.1 * Math.max(0.3, latFactor);
  const controlX = midX - (dy / dist) * offset;
  const controlY = midY + (dx / dist) * offset;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x =
      (1 - t) ** 2 * fx +
      2 * (1 - t) * t * controlX +
      t ** 2 * tx;
    const y =
      (1 - t) ** 2 * fy +
      2 * (1 - t) * t * controlY +
      t ** 2 * ty;
    points.push([x, y]);
  }
  return points;
}

function buildFlowGeoJSON(flows: CapitalFlow[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: flows.map((flow) => ({
      type: "Feature" as const,
      properties: {
        id: flow.id,
        volume: flow.volume,
        type: flow.type,
        label: flow.label,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: generateBezierCurve(flow.from_coords, flow.to_coords),
      },
    })),
  };
}

/** 관계선 GeoJSON 빌더 — 양방향 중복 제거 */
function buildRelationGeoJSON(
  relations: CountryRelation[],
  filterType: "ally" | "rival",
): GeoJSON.FeatureCollection {
  const seen = new Set<string>();
  const features: GeoJSON.Feature[] = [];

  for (const r of relations) {
    if (r.type !== filterType) continue;
    const pairKey = [r.from_iso, r.to_iso].sort().join("-");
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);

    const fromCoords = COUNTRY_CENTROIDS[r.from_iso];
    const toCoords = COUNTRY_CENTROIDS[r.to_iso];
    if (!fromCoords || !toCoords) continue;

    features.push({
      type: "Feature",
      properties: {
        id: r.id,
        from_iso: r.from_iso,
        to_iso: r.to_iso,
        type: r.type,
      },
      geometry: {
        type: "LineString",
        coordinates: generateBezierCurve(fromCoords, toCoords),
      },
    });
  }

  return { type: "FeatureCollection", features };
}

/** Find first symbol layer to insert country layers below it */
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
  const editBaseRef = useRef<string | null>(null);
  const { resolvedTheme } = useTheme();

  const activeIndicator = useMacroMapStore((s) => s.activeIndicator);
  const selectedCountry = useMacroMapStore((s) => s.selectedCountry);
  const showFlows = useMacroMapStore((s) => s.showFlows);
  const showRelations = useMacroMapStore((s) => s.showRelations);
  const relations = useMacroMapStore((s) => s.relations);
  const relationEditMode = useMacroMapStore((s) => s.relationEditMode);
  const relationEditBase = useMacroMapStore((s) => s.relationEditBase);
  const capitalFlows = useMacroMapStore((s) => s.capitalFlows);
  const flowEditMode = useMacroMapStore((s) => s.flowEditMode);
  const flowEditBase = useMacroMapStore((s) => s.flowEditBase);

  const hoveredIdRef = useRef<string | number | null>(null);

  const addCustomLayers = useCallback((map: maplibregl.Map) => {
    if (map.getSource("countries")) return;

    const beforeId = findLabelLayerId(map);
    const state = useMacroMapStore.getState();

    // ── 국가 레이어 ──
    map.addSource("countries", {
      type: "geojson",
      data: GEOJSON_URL,
      promoteId: "ISO_A3",
    });

    map.addLayer(
      {
        id: "countries-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": buildChoroplethExpression(state.activeIndicator),
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.9,
            0.7,
          ],
        },
      },
      beforeId
    );

    const isDark = currentThemeRef.current === "dark";
    map.addLayer(
      {
        id: "countries-border",
        type: "line",
        source: "countries",
        paint: {
          "line-color": isDark
            ? "rgba(255,255,255,0.15)"
            : "rgba(0,0,0,0.15)",
          "line-width": 0.5,
        },
      },
      beforeId
    );

    map.addLayer(
      {
        id: "countries-highlight",
        type: "line",
        source: "countries",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "editBase"], false],
            "#3b82f6",
            "#e67e22",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "editBase"], false],
            3,
            ["boolean", ["feature-state", "hover"], false],
            2,
            0,
          ],
        },
      },
      beforeId
    );

    // ── 관계선 레이어 (자본흐름 아래) ──
    map.addSource("relations-ally", {
      type: "geojson",
      data: buildRelationGeoJSON(state.relations, "ally"),
    });
    map.addSource("relations-rival", {
      type: "geojson",
      data: buildRelationGeoJSON(state.relations, "rival"),
    });

    map.addLayer(
      {
        id: "relation-lines-ally",
        type: "line",
        source: "relations-ally",
        layout: {
          visibility: state.showRelations ? "visible" : "none",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-opacity": 0.7,
        },
      },
      beforeId
    );

    map.addLayer(
      {
        id: "relation-lines-rival",
        type: "line",
        source: "relations-rival",
        layout: {
          visibility: state.showRelations ? "visible" : "none",
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#800020",
          "line-width": 2,
          "line-opacity": 0.7,
          "line-dasharray": [4, 3],
        },
      },
      beforeId
    );

    // ── 자본흐름 레이어 (최상단) ──
    map.addSource("flows", {
      type: "geojson",
      data: buildFlowGeoJSON(state.capitalFlows),
    });

    map.addLayer({
      id: "flow-lines",
      type: "line",
      source: "flows",
      layout: {
        visibility: state.showFlows ? "visible" : "none",
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#e67e22",
        "line-width": [
          "interpolate",
          ["linear"],
          ["get", "volume"],
          10,
          1.5,
          100,
          3,
          500,
          5,
        ],
        "line-opacity": 0.6,
        "line-dasharray": [2, 3],
      },
    });

    // Suppress missing sprite image warnings from basemap
    map.on("styleimagemissing", (e) => {
      if (!map.hasImage(e.id)) {
        map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
      }
    });

    readyRef.current = true;
  }, []);

  // ── 맵 초기화 ──
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
      style: maplibregl.StyleSpecification
    ) {
      const map = new maplibregl.Map({
        container,
        style,
        center: [155, 20],
        zoom: 1.8,
        minZoom: 1.5,
        maxZoom: 8,
        attributionControl: false,
      });

      // 패닝을 1개 세계 범위로 제한 (무한 반복 방지)
      const MIN_LNG = -25;
      const MAX_LNG = 335;
      let prevLng = 155;
      map.on("move", () => {
        const { lat } = map.getCenter();
        let lng = map.getCenter().lng;
        // MapLibre가 경도를 [-180,180]으로 정규화하므로 이전 값 기준 unwrap
        while (lng - prevLng > 180) lng -= 360;
        while (lng - prevLng < -180) lng += 360;
        prevLng = lng;
        if (lng < MIN_LNG || lng > MAX_LNG) {
          const clamped = Math.max(MIN_LNG, Math.min(MAX_LNG, lng));
          prevLng = clamped;
          map.setCenter([clamped, lat]);
        }
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "bottom-right"
      );

      map.on("load", () => {
        addCustomLayers(map);
      });

      // ── 호버 ──
      map.on("mousemove", "countries-fill", (e) => {
        if (!e.features?.length) return;
        const st = useMacroMapStore.getState();
        map.getCanvas().style.cursor =
          st.relationEditMode || st.flowEditMode ? "crosshair" : "pointer";
        const id = e.features[0].properties?.ISO_A3;
        if (hoveredIdRef.current && hoveredIdRef.current !== id) {
          map.setFeatureState(
            { source: "countries", id: hoveredIdRef.current },
            { hover: false }
          );
        }
        if (id) {
          hoveredIdRef.current = id;
          map.setFeatureState(
            { source: "countries", id },
            { hover: true }
          );
          st.setHovered(id as string);
        }
      });

      map.on("mouseleave", "countries-fill", () => {
        const st = useMacroMapStore.getState();
        map.getCanvas().style.cursor =
          st.relationEditMode || st.flowEditMode ? "crosshair" : "";
        if (hoveredIdRef.current) {
          map.setFeatureState(
            { source: "countries", id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
          st.setHovered(null);
        }
      });

      // ── 자본흐름 라인 호버 ──
      map.on("mousemove", "flow-lines", () => {
        const st = useMacroMapStore.getState();
        if (!st.relationEditMode && !st.flowEditMode) {
          map.getCanvas().style.cursor = "pointer";
        }
      });
      map.on("mouseleave", "flow-lines", () => {
        const st = useMacroMapStore.getState();
        if (!st.relationEditMode && !st.flowEditMode) {
          map.getCanvas().style.cursor = "";
        }
      });

      // ── 자본흐름 라인 클릭 → 팝오버로 상세 보기/편집 ──
      map.on("click", "flow-lines", (e) => {
        if (!e.features?.length) return;
        e.preventDefault();
        const flowId = e.features[0].properties?.id as string;
        if (!flowId) return;

        const st = useMacroMapStore.getState();
        const flow = st.capitalFlows.find((f) => f.id === flowId);
        if (!flow) return;

        // 자본흐름 편집 모드로 전환 + 해당 흐름의 팝오버 표시
        if (!st.flowEditMode) {
          st.toggleFlowEditMode();
        }
        st.setFlowEditBase(flow.from_iso);
        st.showFlowPopover(e.point.x, e.point.y, flow.to_iso);
      });

      // ── 국가 클릭 ──
      map.on("click", "countries-fill", (e) => {
        // flow-lines 클릭이 이미 처리한 경우 무시
        if (e.defaultPrevented) return;
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        const iso = props?.ISO_A3 as string;
        if (!iso || iso === "UNK") return;

        const st = useMacroMapStore.getState();

        // 관계선 편집 모드
        if (st.relationEditMode) {
          if (!st.relationEditBase) {
            st.setRelationEditBase(iso);
          } else if (iso !== st.relationEditBase) {
            st.showRelationPopover(e.point.x, e.point.y, iso);
          }
          return;
        }

        // 자본흐름 편집 모드
        if (st.flowEditMode) {
          if (!st.flowEditBase) {
            st.setFlowEditBase(iso);
          } else if (iso !== st.flowEditBase) {
            st.showFlowPopover(e.point.x, e.point.y, iso);
          }
          return;
        }

        // 일반 모드
        const englishName = (props?.name as string) ?? iso;
        st.selectCountry(iso, englishName);

        const centroid = COUNTRY_CENTROIDS[iso];
        if (centroid) {
          map.flyTo({
            center: centroid,
            zoom: Math.max(map.getZoom(), 3.5),
            duration: 800,
          });
        }
      });

      // ── 빈 영역 클릭 ──
      map.on("click", (e) => {
        if (!readyRef.current || !map.getLayer("countries-fill")) return;
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["countries-fill"],
        });
        if (!features.length) {
          const st = useMacroMapStore.getState();
          if (st.relationEditMode) {
            st.setRelationEditBase(null);
            st.hideRelationPopover();
          } else if (st.flowEditMode) {
            st.setFlowEditBase(null);
            st.hideFlowPopover();
          } else {
            st.selectCountry(null);
          }
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

  // ── 테마 변경 ──
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

  // ── 지표 변경 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getLayer("countries-fill")) return;
    map.setPaintProperty(
      "countries-fill",
      "fill-color",
      buildChoroplethExpression(activeIndicator)
    );
  }, [activeIndicator]);

  // ── 자본흐름 토글 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !map.getLayer("flow-lines")) return;
    map.setLayoutProperty(
      "flow-lines",
      "visibility",
      showFlows ? "visible" : "none"
    );
  }, [showFlows]);

  // ── 관계선 토글 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const vis = showRelations ? "visible" : "none";
    for (const layerId of RELATION_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", vis);
      }
    }
  }, [showRelations]);

  // ── 관계 데이터 변경 → 소스 업데이트 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const allySource = map.getSource("relations-ally") as maplibregl.GeoJSONSource | undefined;
    const rivalSource = map.getSource("relations-rival") as maplibregl.GeoJSONSource | undefined;

    if (allySource) allySource.setData(buildRelationGeoJSON(relations, "ally"));
    if (rivalSource) rivalSource.setData(buildRelationGeoJSON(relations, "rival"));
  }, [relations]);

  // ── 자본흐름 데이터 변경 → 소스 업데이트 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const flowSource = map.getSource("flows") as maplibregl.GeoJSONSource | undefined;
    if (flowSource) flowSource.setData(buildFlowGeoJSON(capitalFlows));
  }, [capitalFlows]);

  // ── 국가 선택 시 관계선 하이라이트 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    for (const layerId of RELATION_LAYER_IDS) {
      if (!map.getLayer(layerId)) continue;

      if (selectedCountry) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const highlightExpr: any = [
          "case",
          [
            "any",
            ["==", ["get", "from_iso"], selectedCountry],
            ["==", ["get", "to_iso"], selectedCountry],
          ],
          0.9,
          0.15,
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const widthExpr: any = [
          "case",
          [
            "any",
            ["==", ["get", "from_iso"], selectedCountry],
            ["==", ["get", "to_iso"], selectedCountry],
          ],
          3,
          2,
        ];
        map.setPaintProperty(layerId, "line-opacity", highlightExpr);
        map.setPaintProperty(layerId, "line-width", widthExpr);
      } else {
        map.setPaintProperty(layerId, "line-opacity", 0.7);
        map.setPaintProperty(layerId, "line-width", 2);
      }
    }
  }, [selectedCountry]);

  // ── 편집 모드 기준 국가 하이라이트 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const currentBase = relationEditBase ?? flowEditBase;

    // 이전 기준 국가 해제
    if (editBaseRef.current) {
      map.setFeatureState(
        { source: "countries", id: editBaseRef.current },
        { editBase: false }
      );
    }

    // 새 기준 국가 설정
    if (currentBase) {
      map.setFeatureState(
        { source: "countries", id: currentBase },
        { editBase: true }
      );
    }

    editBaseRef.current = currentBase;
  }, [relationEditBase, flowEditBase]);

  // ── 편집 모드 커서 ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor =
      relationEditMode || flowEditMode ? "crosshair" : "";
  }, [relationEditMode, flowEditMode]);

  // ── 선택 국가 fly-to ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCountry) return;
    const centroid = COUNTRY_CENTROIDS[selectedCountry];
    if (centroid) {
      map.flyTo({
        center: centroid,
        zoom: Math.max(map.getZoom(), 3.5),
        duration: 800,
      });
    }
  }, [selectedCountry]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
