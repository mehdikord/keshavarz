/**
 * Satellite imagery tiles.
 *
 * Neshan (the map provider) has no satellite imagery, so the satellite view
 * draws Parsimap's satellite raster under Neshan's own streets and place
 * names (see `neshan.ts`). Only the imagery comes from Parsimap.
 *
 * The tile URL is resolved from Parsimap's style endpoint at runtime so a
 * backend move on their side does not break the map; the fallback URL is only
 * used when that request fails.
 */

export interface SatelliteImagery {
  tileUrl: string;
  attribution: string;
  maxNativeZoom: number;
}

const PARSIMAP_API_ORIGIN = "https://api.parsimap.ir";
const SATELLITE_STYLE = "satellite-raster";
const FALLBACK_TILE_URL = "https://backapi.parsimap.ir/tile/googlesat/{z}/{x}/{y}";
const MAX_NATIVE_ZOOM = 18;

// Parsimap requires this attribution to stay visible and unchanged.
const ATTRIBUTION =
  '<a href="https://www.parsimap.ir" target="_blank" rel="noopener">&copy; Parsimap</a>';

export const SATELLITE_IMAGERY_TOKEN =
  process.env.NEXT_PUBLIC_PARSIMAP_MAP_TOKEN ?? "";

/** The style endpoint can hang; past this the fallback tile URL is used. */
const STYLE_TIMEOUT_MS = 4000;

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
  return `${base}${separator}key=${encodeURIComponent(SATELLITE_IMAGERY_TOKEN)}`;
}

const fallback: SatelliteImagery = {
  tileUrl: withToken(FALLBACK_TILE_URL),
  attribution: ATTRIBUTION,
  maxNativeZoom: MAX_NATIVE_ZOOM,
};

let pending: Promise<SatelliteImagery> | null = null;

export function resolveSatelliteImagery(): Promise<SatelliteImagery> {
  if (pending) return pending;

  const styleUrl = `${PARSIMAP_API_ORIGIN}/styles/${SATELLITE_STYLE}?key=${encodeURIComponent(SATELLITE_IMAGERY_TOKEN)}`;

  pending = fetch(styleUrl, { signal: AbortSignal.timeout(STYLE_TIMEOUT_MS) })
    .then((response) => {
      if (!response.ok) throw new Error(`Satellite style ${response.status}`);
      return response.json() as Promise<ParsimapStyle>;
    })
    .then((style): SatelliteImagery => {
      const source = style.sources?.composite;
      const tileUrl = source?.tiles?.[0];
      if (!tileUrl) return fallback;

      return {
        tileUrl: withToken(tileUrl),
        attribution: source.attribution || ATTRIBUTION,
        maxNativeZoom: Math.min(source.maxzoom ?? MAX_NATIVE_ZOOM, MAX_NATIVE_ZOOM),
      };
    })
    .catch(() => fallback);

  return pending;
}
