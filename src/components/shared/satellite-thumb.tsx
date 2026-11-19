"use client";

import { useEffect, useState } from "react";

import { resolveSatelliteImagery } from "@/lib/maps/satellite-imagery";
import { cn } from "@/lib/utils";

const TILE = 256;
const OFFSETS = [-1, 0, 1] as const;

/** Web-Mercator world pixel for a coordinate at a zoom level. */
function worldPixel(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const latRad = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  };
}

interface SatelliteThumbProps {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
  /** Rendered underneath; stays visible if tiles cannot load. */
  fallback?: React.ReactNode;
}

/**
 * A static satellite preview built from a 3×3 block of imagery tiles centred on
 * the point — far lighter than mounting a WebGL map for every list item. Tapping
 * the preview opens the full Neshan map, which has the place names.
 */
export function SatelliteThumb({ lat, lng, zoom = 16, className, fallback }: SatelliteThumbProps) {
  const [template, setTemplate] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveSatelliteImagery().then((imagery) => {
      if (!cancelled) setTemplate(imagery.tileUrl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const point = worldPixel(lat, lng, zoom);
  const tileX = Math.floor(point.x / TILE);
  const tileY = Math.floor(point.y / TILE);
  const offsetX = point.x - (tileX - 1) * TILE;
  const offsetY = point.y - (tileY - 1) * TILE;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {fallback}
      {template && !failed ? (
        <div
          aria-hidden
          className="absolute grid grid-cols-3"
          style={{ left: `calc(50% - ${offsetX}px)`, top: `calc(50% - ${offsetY}px)`, width: TILE * 3 }}
        >
          {OFFSETS.flatMap((dy) =>
            OFFSETS.map((dx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${dx}:${dy}`}
                src={template
                  .replace("{z}", String(zoom))
                  .replace("{x}", String(tileX + dx))
                  .replace("{y}", String(tileY + dy))}
                alt=""
                width={TILE}
                height={TILE}
                loading="lazy"
                draggable={false}
                onError={() => setFailed(true)}
                className="block size-64 max-w-none select-none"
              />
            )),
          )}
        </div>
      ) : null}
    </div>
  );
}
