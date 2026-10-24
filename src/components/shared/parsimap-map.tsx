"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DivIcon, Map as LeafletMap, Marker, TileLayer } from "leaflet";
import { CloudOff, Map as MapIcon, Minus, Plus, Satellite } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEFAULT_MAP_OVERVIEW_ZOOM } from "@/lib/maps/defaults";
import {
  DEFAULT_PARSIMAP_LAYER,
  PARSIMAP_LAYERS,
  PARSIMAP_MAP_TOKEN,
  PARSIMAP_MAX_ZOOM,
  isSameLocation,
  normalizeLocation,
  resolveParsimapLayer,
  type ParsimapLayerId,
} from "@/lib/maps/parsimap";
import type { GeoLocation } from "@/types";

type Leaflet = typeof import("leaflet");

const LAYER_ICONS: Record<ParsimapLayerId, typeof Satellite> = {
  satellite: Satellite,
  street: MapIcon,
};

interface ParsimapMapProps {
  center: GeoLocation;
  value?: GeoLocation | null;
  onChange?: (location: GeoLocation) => void;
  /**
   * Interactive maps use a fixed center pin: the user moves the map under the
   * pin and the map center becomes the selected location.
   */
  interactive?: boolean;
  zoom?: number;
  showControls?: boolean;
  /** Extra round buttons rendered under the zoom controls. */
  controls?: ReactNode;
  onMapReady?: (map: LeafletMap | null) => void;
  className?: string;
}

export function MapControlButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg ring-1 ring-black/5 backdrop-blur-md transition active:scale-90 disabled:opacity-60 dark:ring-white/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ParsimapMap({
  center,
  value,
  onChange,
  interactive = true,
  zoom = 17,
  showControls = true,
  controls,
  onMapReady,
  className,
}: ParsimapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<Leaflet | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const markerIconRef = useRef<DivIcon | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  const lastCenterRef = useRef<GeoLocation>(value ?? center);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onMapReadyRef = useRef(onMapReady);

  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState<ParsimapLayerId>(DEFAULT_PARSIMAP_LAYER);
  const [moving, setMoving] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    onMapReadyRef.current = onMapReady;
  }, [onChange, onMapReady]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    void import("leaflet").then((leafletModule) => {
      if (disposed || !containerRef.current) return;

      const L = leafletModule.default;
      const start = lastCenterRef.current;
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: initialValueRef.current ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM,
        maxZoom: PARSIMAP_MAX_ZOOM,
        zoomControl: false,
        attributionControl: true,
        // Zooming around the center keeps the picker pin on the same spot.
        scrollWheelZoom: interactive ? "center" : true,
        touchZoom: interactive ? "center" : true,
        doubleClickZoom: interactive ? "center" : true,
        zoomSnap: 0.5,
      });

      markerIconRef.current = L.divIcon({
        className: "parsimap-marker",
        html: '<span class="parsimap-pin" aria-hidden="true"></span>',
        iconSize: [36, 44],
        iconAnchor: [18, 43],
      });

      if (interactive) {
        map.on("movestart", () => setMoving(true));
        map.on("moveend", () => {
          setMoving(false);
          const point = map.getCenter();
          const location = normalizeLocation(point.lat, point.lng);
          if (isSameLocation(location, lastCenterRef.current)) return;
          lastCenterRef.current = location;
          onChangeRef.current?.(location);
        });
        map.on("click", (event) => map.panTo(event.latlng));
      }

      resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(containerRef.current);

      leafletRef.current = L;
      mapRef.current = map;
      setReady(true);
      onMapReadyRef.current?.(map);
    });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      onMapReadyRef.current?.(null);
      markerRef.current = null;
      tileLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [interactive, zoom]);

  // Base layer
  useEffect(() => {
    if (!ready) return;

    let stale = false;
    void resolveParsimapLayer(layer).then((resolved) => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (stale || !L || !map) return;

      const tileLayer = L.tileLayer(resolved.tileUrl, {
        attribution: resolved.attribution,
        maxNativeZoom: resolved.maxNativeZoom,
        maxZoom: PARSIMAP_MAX_ZOOM,
        keepBuffer: 4,
      });

      let failures = 0;
      tileLayer.on("tileerror", () => {
        failures += 1;
        if (failures >= 4) setTilesFailed(true);
      });
      tileLayer.on("tileload", () => {
        failures = 0;
        setTilesFailed(false);
      });

      tileLayer.addTo(map);
      tileLayerRef.current?.remove();
      tileLayerRef.current = tileLayer;
    });

    return () => {
      stale = true;
    };
  }, [layer, ready]);

  // Keep the view (and the read-only marker) in sync with `value`.
  const centerLat = center.lat;
  const centerLng = center.lng;

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    if (interactive) {
      if (!value || isSameLocation(value, lastCenterRef.current)) return;
      lastCenterRef.current = value;
      map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), zoom), {
        duration: 0.8,
      });
      return;
    }

    const location = value ?? { lat: centerLat, lng: centerLng };
    map.setView([location.lat, location.lng], value ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM);

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
      return;
    }

    if (!markerIconRef.current) return;
    markerRef.current = L.marker([value.lat, value.lng], {
      icon: markerIconRef.current,
      keyboard: false,
      interactive: false,
    }).addTo(map);
  }, [centerLat, centerLng, interactive, ready, value, zoom]);

  return (
    <div className={cn("relative isolate h-72 w-full overflow-hidden bg-muted", className)}>
      <div
        ref={containerRef}
        className="parsimap-container absolute inset-0"
        aria-label={interactive ? "انتخاب موقعیت روی نقشه" : "نمایش موقعیت روی نقشه"}
      />

      {!ready ? (
        <div className="pointer-events-none absolute inset-0 z-[400] animate-pulse bg-muted" />
      ) : null}

      {interactive ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[450] -translate-x-1/2 -translate-y-full">
          <span
            className={cn(
              "parsimap-pin block transition-transform duration-200 ease-out",
              moving && "-translate-y-3",
              !value && "opacity-90",
            )}
          />
          <span
            className={cn(
              "absolute -bottom-1 left-1/2 h-2 w-4 -translate-x-1/2 rounded-[50%] bg-black/35 blur-[1px] transition-all duration-200",
              moving && "w-2.5 opacity-60",
            )}
          />
        </div>
      ) : null}

      {showControls ? (
        <>
          <div
            role="radiogroup"
            aria-label="نوع نقشه"
            className="absolute left-3 top-3 z-[500] flex gap-0.5 rounded-full bg-background/95 p-1 shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10"
          >
            {(Object.keys(PARSIMAP_LAYERS) as ParsimapLayerId[]).map((item) => {
              const Icon = LAYER_ICONS[item];
              const active = layer === item;
              return (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setLayer(item)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {PARSIMAP_LAYERS[item].label}
                </button>
              );
            })}
          </div>

          <div className="absolute right-3 top-3 z-[500] flex flex-col items-center gap-2">
            <div className="flex flex-col overflow-hidden rounded-full bg-background/95 shadow-lg ring-1 ring-black/5 backdrop-blur-md dark:ring-white/10">
              <button
                type="button"
                aria-label="بزرگ‌نمایی"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex size-10 items-center justify-center transition active:bg-muted"
              >
                <Plus className="size-4.5" />
              </button>
              <span className="mx-2 h-px bg-border" />
              <button
                type="button"
                aria-label="کوچک‌نمایی"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex size-10 items-center justify-center transition active:bg-muted"
              >
                <Minus className="size-4.5" />
              </button>
            </div>
            {controls}
          </div>
        </>
      ) : null}

      {tilesFailed || !PARSIMAP_MAP_TOKEN ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-8 z-[500] flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] text-destructive shadow-lg backdrop-blur-md">
            <CloudOff className="size-3.5" />
            {PARSIMAP_MAP_TOKEN
              ? "بارگذاری نقشه ناموفق بود؛ اتصال اینترنت را بررسی کنید"
              : "توکن نقشه پارسی‌مپ تنظیم نشده است"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
