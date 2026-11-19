"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CloudOff, Map as MapIcon, Minus, Plus, Satellite } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEFAULT_MAP_OVERVIEW_ZOOM } from "@/lib/maps/defaults";
import {
  DEFAULT_MAP_LAYER,
  MAP_LAYERS,
  MAP_MAX_ZOOM,
  NESHAN_MAP_KEY,
  SATELLITE_IMAGERY_SOURCE_ID,
  isSameLocation,
  loadMapStyle,
  normalizeLocation,
  type MapLayerId,
} from "@/lib/maps/neshan";
import type { GeoLocation } from "@/types";

type NeshanSdk = typeof import("@neshan-maps-platform/maplibre-sdk").default;
export type NeshanMapInstance = InstanceType<NeshanSdk["Map"]>;
type MapMarker = InstanceType<NeshanSdk["Marker"]>;

const LAYER_ICONS: Record<MapLayerId, typeof Satellite> = {
  satellite: Satellite,
  street: MapIcon,
};

interface NeshanMapProps {
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
  onMapReady?: (map: NeshanMapInstance | null) => void;
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

function pinElement() {
  const element = document.createElement("span");
  element.className = "map-pin";
  element.setAttribute("aria-hidden", "true");
  return element;
}

export function NeshanMap({
  center,
  value,
  onChange,
  interactive = true,
  zoom = 17,
  showControls = true,
  controls,
  onMapReady,
  className,
}: NeshanMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkRef = useRef<NeshanSdk | null>(null);
  const mapRef = useRef<NeshanMapInstance | null>(null);
  const markerRef = useRef<MapMarker | null>(null);
  const appliedLayerRef = useRef<MapLayerId>(DEFAULT_MAP_LAYER);
  const lastCenterRef = useRef<GeoLocation>(value ?? center);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onMapReadyRef = useRef(onMapReady);

  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState<MapLayerId>(DEFAULT_MAP_LAYER);
  const [moving, setMoving] = useState(false);
  const [failure, setFailure] = useState<"style" | "imagery" | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onMapReadyRef.current = onMapReady;
  }, [onChange, onMapReady]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !NESHAN_MAP_KEY) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;
    const initialLayer = appliedLayerRef.current;

    void Promise.all([
      import("@neshan-maps-platform/maplibre-sdk"),
      loadMapStyle(initialLayer),
    ])
      .then(([sdkModule, style]) => {
        if (disposed || !containerRef.current) return;

        const sdk = sdkModule.default;
        const start = lastCenterRef.current;
        const map = new sdk.Map({
          container: containerRef.current,
          apiKey: NESHAN_MAP_KEY,
          style,
          center: [start.lng, start.lat],
          zoom: initialValueRef.current ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM,
          maxZoom: MAP_MAX_ZOOM,
          // A flat, north-up map: rotation and tilt only confuse parcel picking.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          // Zooming around the center keeps the picker pin on the same spot.
          scrollZoom: interactive ? { around: "center" } : true,
          touchZoomRotate: interactive ? { around: "center" } : true,
          doubleClickZoom: !interactive,
          logoPosition: "bottom-left",
          copyRightPosition: "bottom-right",
        });
        map.touchZoomRotate.disableRotation();
        map.keyboard.disableRotation();

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
          map.on("click", (event) => map.easeTo({ center: event.lngLat }));
        }

        let imageryErrors = 0;
        map.on("error", (event) => {
          // Tile errors carry the id of the source that failed.
          const sourceId = (event as { sourceId?: string }).sourceId;
          if (sourceId !== SATELLITE_IMAGERY_SOURCE_ID) return;
          imageryErrors += 1;
          if (imageryErrors >= 4) setFailure("imagery");
        });
        map.on("sourcedata", (event) => {
          if (event.sourceId !== SATELLITE_IMAGERY_SOURCE_ID || !event.tile) return;
          imageryErrors = 0;
          setFailure((current) => (current === "imagery" ? null : current));
        });

        const container = containerRef.current;
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(container);

        sdkRef.current = sdk;
        mapRef.current = map;
        setReady(true);
        onMapReadyRef.current?.(map);
      })
      .catch(() => {
        if (!disposed) setFailure("style");
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      onMapReadyRef.current?.(null);
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [interactive, zoom]);

  // Base layer: swap the whole style; DOM markers survive a style change.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || appliedLayerRef.current === layer) return;

    let stale = false;
    void loadMapStyle(layer)
      .then((style) => {
        if (stale || mapRef.current !== map) return;
        appliedLayerRef.current = layer;
        map.setStyle(style);
        setFailure(null);
      })
      .catch(() => {
        if (!stale) setFailure("style");
      });

    return () => {
      stale = true;
    };
  }, [layer, ready]);

  // Keep the view (and the read-only marker) in sync with `value`.
  const centerLat = center.lat;
  const centerLng = center.lng;

  useEffect(() => {
    const sdk = sdkRef.current;
    const map = mapRef.current;
    if (!ready || !sdk || !map) return;

    if (interactive) {
      if (!value || isSameLocation(value, lastCenterRef.current)) return;
      lastCenterRef.current = value;
      map.flyTo({
        center: [value.lng, value.lat],
        zoom: Math.max(map.getZoom(), zoom),
        duration: 800,
      });
      return;
    }

    const location = value ?? { lat: centerLat, lng: centerLng };
    map.jumpTo({
      center: [location.lng, location.lat],
      zoom: value ? zoom : DEFAULT_MAP_OVERVIEW_ZOOM,
    });

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([value.lng, value.lat]);
      return;
    }

    markerRef.current = new sdk.Marker({ element: pinElement(), anchor: "bottom" })
      .setLngLat([value.lng, value.lat])
      .addTo(map);
  }, [centerLat, centerLng, interactive, ready, value, zoom]);

  const message = !NESHAN_MAP_KEY
    ? "کلید نقشه نشان تنظیم نشده است"
    : failure === "style"
      ? "بارگذاری نقشه ناموفق بود؛ اتصال اینترنت را بررسی کنید"
      : failure === "imagery"
        ? "بارگذاری تصویر ماهواره‌ای ناموفق بود؛ حالت «نقشه» را امتحان کنید"
        : null;

  return (
    <div className={cn("relative isolate h-72 w-full overflow-hidden bg-muted", className)}>
      <div
        ref={containerRef}
        dir="ltr"
        // Inline on purpose: the SDK's unlayered `.maplibregl-map { position: relative }`
        // beats Tailwind's layered `absolute`, which collapsed the map to 0px height.
        style={{ position: "absolute", inset: 0 }}
        className="neshan-map"
        aria-label={interactive ? "انتخاب موقعیت روی نقشه" : "نمایش موقعیت روی نقشه"}
      />

      {!ready && failure !== "style" ? (
        <div className="pointer-events-none absolute inset-0 z-[400] animate-pulse bg-muted" />
      ) : null}

      {interactive ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[450] -translate-x-1/2 -translate-y-full">
          <span
            className={cn(
              "map-pin block transition-transform duration-200 ease-out",
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
            {(Object.keys(MAP_LAYERS) as MapLayerId[]).map((item) => {
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
                  {MAP_LAYERS[item].label}
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

      {message ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-8 z-[500] flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] text-destructive shadow-lg backdrop-blur-md">
            <CloudOff className="size-3.5" />
            {message}
          </span>
        </div>
      ) : null}
    </div>
  );
}
