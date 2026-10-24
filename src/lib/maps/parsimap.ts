import type { GeoLocation } from "@/types";

/**
 * Parsimap raster layers (https://docs.parsimap.ir/javascript/leaflet).
 *
 * Tile URLs are resolved from the official style endpoint at runtime so a
 * backend move on Parsimap's side does not break the map; the fallback URL is
 * only used when that request fails.
 */

export type ParsimapLayerId = "satellite" | "street";

export interface ParsimapLayerConfig {
  id: ParsimapLayerId;
  label: string;
  style: string;
  fallbackTileUrl: string;
  attribution: string;
  maxNativeZoom: number;
}

export interface ResolvedParsimapLayer {
  tileUrl: string;
  attribution: string;
  maxNativeZoom: number;
}

const PARSIMAP_API_ORIGIN = "https://api.parsimap.ir";

// Parsimap requires this attribution to stay visible and unchanged.
const PARSIMAP_ATTRIBUTION =
  '<a href="https://www.parsimap.ir" target="_blank" rel="noopener">&copy; Parsimap</a>';
const OSM_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/about/" target="_blank" rel="noopener">&copy; OpenStreetMap</a>';

export const PARSIMAP_LAYERS: Record<ParsimapLayerId, ParsimapLayerConfig> = {
  satellite: {
    id: "satellite",
    label: "ماهواره‌ای",
    style: "satellite-raster",
    fallbackTileUrl: "https://backapi.parsimap.ir/tile/googlesat/{z}/{x}/{y}",
    attribution: PARSIMAP_ATTRIBUTION,
    maxNativeZoom: 18,
  },
  street: {
    id: "street",
    label: "نقشه",
    style: "parsimap-streets-v11-raster",
    fallbackTileUrl:
      "https://api.parsimap.ir/tile/parsimap-streets-v11-raster/{z}/{x}/{y}",
    attribution: `${PARSIMAP_ATTRIBUTION} ${OSM_ATTRIBUTION}`,
    maxNativeZoom: 18,
  },
};

export const DEFAULT_PARSIMAP_LAYER: ParsimapLayerId = "satellite";

/** Tiles above the native zoom are upscaled so users can inspect a parcel. */
export const PARSIMAP_MAX_ZOOM = 20;

export const PARSIMAP_MAP_TOKEN =
  process.env.NEXT_PUBLIC_PARSIMAP_MAP_TOKEN ?? "";

interface ParsimapStyle {
  sources?: {
    composite?: {
      tiles?: string[];
      attribution?: string;
      maxzoom?: number;
    };
  };
}

function withToken(url: string): string {
  const base = url.replace(/([?&])key=[^&]*&?/, "$1").replace(/[?&]$/, "");
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}key=${encodeURIComponent(PARSIMAP_MAP_TOKEN)}`;
}

function fallbackLayer(config: ParsimapLayerConfig): ResolvedParsimapLayer {
  return {
    tileUrl: withToken(config.fallbackTileUrl),
    attribution: config.attribution,
    maxNativeZoom: config.maxNativeZoom,
  };
}

const resolvedLayers = new Map<ParsimapLayerId, Promise<ResolvedParsimapLayer>>();

export function resolveParsimapLayer(
  id: ParsimapLayerId,
): Promise<ResolvedParsimapLayer> {
  const cached = resolvedLayers.get(id);
  if (cached) return cached;

  const config = PARSIMAP_LAYERS[id];
  const styleUrl = `${PARSIMAP_API_ORIGIN}/styles/${config.style}?key=${encodeURIComponent(PARSIMAP_MAP_TOKEN)}`;

  const pending = fetch(styleUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Parsimap style ${response.status}`);
      return response.json() as Promise<ParsimapStyle>;
    })
    .then((style) => {
      const source = style.sources?.composite;
      const tileUrl = source?.tiles?.[0];
      if (!tileUrl) return fallbackLayer(config);

      return {
        tileUrl: withToken(tileUrl),
        attribution: source.attribution || config.attribution,
        maxNativeZoom: Math.min(source.maxzoom ?? config.maxNativeZoom, PARSIMAP_MAX_ZOOM),
      };
    })
    .catch(() => fallbackLayer(config));

  resolvedLayers.set(id, pending);
  return pending;
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
