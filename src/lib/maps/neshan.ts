import type { NeshanMapOptions } from "@neshan-maps-platform/maplibre-sdk";

import { resolveSatelliteImagery, type SatelliteImagery } from "@/lib/maps/satellite-imagery";
import type { GeoLocation } from "@/types";

/**
 * Neshan map (https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/).
 *
 * - "street": Neshan's own Light style, unchanged.
 * - "satellite": satellite imagery with Neshan's streets and place names drawn
 *   on top, so names read exactly like the street view. Neshan has no imagery
 *   of its own; see `satellite-imagery.ts`.
 */

export type MapLayerId = "satellite" | "street";

export const MAP_LAYERS: Record<MapLayerId, { label: string }> = {
  satellite: { label: "ماهواره‌ای" },
  street: { label: "نقشه" },
};

export const DEFAULT_MAP_LAYER: MapLayerId = "satellite";

/** Imagery above its native zoom is upscaled so users can inspect a parcel. */
export const MAP_MAX_ZOOM = 20;

export const NESHAN_MAP_KEY = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY ?? "";

const NESHAN_STYLE_URL = "https://static.neshan.org/sdk/maplibre/styles/light.json";

export type MapStyle = Exclude<NeshanMapOptions["style"], string | undefined>;
type StyleLayer = MapStyle["layers"][number];
type LooseLayer = Record<string, unknown> & {
  id: string;
  type: string;
  "source-layer"?: string;
  paint?: Record<string, unknown>;
};

export const SATELLITE_IMAGERY_SOURCE_ID = "satellite-imagery";

// Road centre lines kept over the imagery (casings, paths, rails, tunnels are dropped).
const SATELLITE_ROAD_LAYERS = new Set([
  "residential-street",
  "tertiary",
  "secondary",
  "primary",
  "highways",
  "residential-bridge",
  "tertiary bridge",
  "secondary bridge",
  "primary bridge",
  "highway bridge",
]);

// Light text with a dark halo stays readable on any imagery.
const LABEL_PAINT = {
  "text-color": "hsl(0, 0%, 100%)",
  "text-halo-color": "hsla(0, 0%, 8%, 0.85)",
  "text-halo-width": 1.6,
};

const NEIGHBOURHOOD_TYPES = ["neighbourhood", "suburb", "subrub2", "locality"];

function satelliteLayer(layer: LooseLayer): LooseLayer | null {
  if (layer.type === "symbol") {
    // One-way arrows and POI icons only add noise over imagery.
    if (layer.id.includes("arrow") || layer.id === "points") return null;
    const paint: Record<string, unknown> = { ...layer.paint, ...LABEL_PAINT };
    if (layer.id === "place-label") {
      paint["text-color"] = [
        "match",
        ["get", "type"],
        NEIGHBOURHOOD_TYPES,
        "hsl(188, 85%, 84%)",
        "hsl(0, 0%, 100%)",
      ];
    }
    return { ...layer, paint };
  }

  if (layer.type !== "line") return null;

  if (layer["source-layer"] === "admin") {
    return { ...layer, paint: { ...layer.paint, "line-color": "hsla(0, 0%, 100%, 0.7)" } };
  }

  if (SATELLITE_ROAD_LAYERS.has(layer.id)) {
    return { ...layer, paint: { ...layer.paint, "line-opacity": 0.55 } };
  }

  return null;
}

function satelliteStyle(base: MapStyle | null, imagery: SatelliteImagery): MapStyle {
  const imageryLayer = {
    id: SATELLITE_IMAGERY_SOURCE_ID,
    type: "raster",
    source: SATELLITE_IMAGERY_SOURCE_ID,
  } as StyleLayer;

  const imagerySource = {
    type: "raster" as const,
    tiles: [imagery.tileUrl],
    tileSize: 256,
    maxzoom: imagery.maxNativeZoom,
    attribution: imagery.attribution,
  };

  if (!base) {
    // Neshan's style is unreachable: imagery alone is still usable.
    return {
      version: 8,
      sources: { [SATELLITE_IMAGERY_SOURCE_ID]: imagerySource },
      layers: [imageryLayer],
    };
  }

  const overlay = (base.layers as unknown as LooseLayer[])
    .map(satelliteLayer)
    .filter((layer): layer is LooseLayer => layer !== null) as unknown as StyleLayer[];

  return {
    ...base,
    name: "Neshan Satellite",
    sources: { [SATELLITE_IMAGERY_SOURCE_ID]: imagerySource, ...base.sources },
    layers: [imageryLayer, ...overlay],
  };
}

let baseStyle: Promise<MapStyle> | null = null;

function loadNeshanStyle(): Promise<MapStyle> {
  baseStyle ??= fetch(NESHAN_STYLE_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Neshan style ${response.status}`);
      return response.json() as Promise<MapStyle>;
    })
    .catch((error: unknown) => {
      baseStyle = null; // retry on the next request
      throw error;
    });
  return baseStyle;
}

/** Resolves the full style for a layer. Rejects only if the street style is unavailable. */
export async function loadMapStyle(layer: MapLayerId): Promise<MapStyle> {
  if (layer === "street") return loadNeshanStyle();

  const [base, imagery] = await Promise.all([
    loadNeshanStyle().catch(() => null),
    resolveSatelliteImagery(),
  ]);
  return satelliteStyle(base, imagery);
}

export function normalizeLocation(lat: number, lng: number): GeoLocation {
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

export function isSameLocation(a: GeoLocation, b: GeoLocation): boolean {
  return Math.abs(a.lat - b.lat) < 2e-6 && Math.abs(a.lng - b.lng) < 2e-6;
}
