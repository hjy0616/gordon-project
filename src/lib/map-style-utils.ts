import type maplibregl from "maplibre-gl";

const LABEL_REPLACEMENTS: Record<string, string> = {
  "조선민주주의인민공화국": "북한",
};

/**
 * Convert a Mapbox-style template string (e.g. "{name:ko}\n{name:latin}")
 * into a MapLibre format expression, replacing specified Korean labels.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function templateToFormatExpr(template: string): any[] {
  const expr: unknown[] = ["format"];
  const re = /\{([^}]+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(template)) !== null) {
    if (m.index > last) expr.push(template.slice(last, m.index), {});
    const prop = m[1];
    if (prop === "name:ko") {
      const cases: unknown[] = ["case"];
      for (const [from, to] of Object.entries(LABEL_REPLACEMENTS)) {
        cases.push(["==", ["coalesce", ["get", "name:ko"], ""], from], to);
      }
      cases.push(["coalesce", ["get", "name:ko"], ""]);
      expr.push(cases, {});
    } else {
      expr.push(["coalesce", ["get", prop], ""], {});
    }
    last = m.index + m[0].length;
  }
  if (last < template.length) expr.push(template.slice(last), {});
  return expr;
}

/** Patch symbol layers to replace unwanted Korean labels */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patchLabelText(layers: any[]): void {
  for (const layer of layers) {
    if (layer.type !== "symbol" || !layer.layout?.["text-field"]) continue;
    const tf = layer.layout["text-field"];
    if (typeof tf === "string" && tf.includes("name:ko")) {
      layer.layout["text-field"] = templateToFormatExpr(tf);
    }
  }
}

/** Fetch style JSON, inject projection, and patch Korean labels */
export async function fetchStyle(
  url: string,
): Promise<maplibregl.StyleSpecification> {
  const res = await fetch(url);
  const style = await res.json();
  if (!style.projection) {
    style.projection = { type: "mercator" };
  }
  if (style.layers) {
    patchLabelText(style.layers);
  }
  return style;
}
