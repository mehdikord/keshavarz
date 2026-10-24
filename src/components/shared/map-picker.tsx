"use client";

import { useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import {
  Check,
  Crosshair,
  Hand,
  LoaderCircle,
  LocateFixed,
  Maximize2,
  MapPin,
  X,
} from "lucide-react";

import { MapControlButton, ParsimapMap } from "@/components/shared/parsimap-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/defaults";
import { normalizeLocation } from "@/lib/maps/parsimap";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation } from "@/types";

interface MapPickerProps {
  value: GeoLocation | null;
  onChange?: (location: GeoLocation) => void;
  className?: string;
  interactive?: boolean;
}

function useCurrentPosition(onLocate: (location: GeoLocation) => void) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) {
      setError("مرورگر شما دسترسی به موقعیت مکانی را پشتیبانی نمی‌کند");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocate(
          normalizeLocation(position.coords.latitude, position.coords.longitude),
        );
        setLocating(false);
      },
      (positionError) => {
        setLocating(false);
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "برای دریافت موقعیت، دسترسی Location را فعال کنید"
            : "دریافت موقعیت فعلی ناموفق بود؛ نقطه را روی نقشه انتخاب کنید",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 30_000,
      },
    );
  };

  return { locate, locating, error };
}

function LocationLabel({ value }: { value: GeoLocation | null }) {
  if (!value) {
    return <span className="text-xs text-muted-foreground">موقعیت انتخاب نشده</span>;
  }

  return (
    <span
      className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-foreground"
      dir="ltr"
    >
      <MapPin className="size-3.5 shrink-0 text-primary" />
      <span className="truncate tabular-nums">
        {toPersianDigits(value.lat)}, {toPersianDigits(value.lng)}
      </span>
    </span>
  );
}

function PickerHint({ selected }: { selected: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[500] flex justify-center px-3">
      <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[11px] text-white shadow-md backdrop-blur-md">
        <Hand className="size-3.5" />
        {selected
          ? "نقشه را جابه‌جا کنید تا پین روی زمین قرار بگیرد"
          : "نقشه را بکشید و پین را روی زمین موردنظر بگذارید"}
      </span>
    </div>
  );
}

export function MapPicker({
  value,
  onChange,
  className,
  interactive = true,
}: MapPickerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenCenter, setFullscreenCenter] =
    useState<GeoLocation>(DEFAULT_MAP_CENTER);
  const inlineMapRef = useRef<LeafletMap | null>(null);
  const fullscreenMapRef = useRef<LeafletMap | null>(null);
  const { locate, locating, error } = useCurrentPosition((location) =>
    onChange?.(location),
  );

  const selectCenter = (map: LeafletMap | null) => {
    if (!map) return;
    const point = map.getCenter();
    onChange?.(normalizeLocation(point.lat, point.lng));
  };

  const openFullscreen = () => {
    setFullscreenCenter(inlineCenter(inlineMapRef.current));
    setFullscreen(true);
  };

  const gpsButton = (
    <MapControlButton
      label="موقعیت من"
      onClick={locate}
      disabled={locating}
      className="text-primary"
    >
      {locating ? (
        <LoaderCircle className="size-4.5 animate-spin" />
      ) : (
        <Crosshair className="size-4.5" />
      )}
    </MapControlButton>
  );

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="relative isolate overflow-hidden rounded-3xl border border-border shadow-sm">
        <ParsimapMap
          center={value ?? DEFAULT_MAP_CENTER}
          value={value}
          onChange={onChange}
          interactive={interactive}
          onMapReady={(map) => {
            inlineMapRef.current = map;
          }}
          className="h-80 sm:h-96"
          controls={
            interactive ? (
              <>
                {gpsButton}
                <MapControlButton label="تمام‌صفحه" onClick={openFullscreen}>
                  <Maximize2 className="size-4" />
                </MapControlButton>
              </>
            ) : null
          }
        />
        {interactive ? <PickerHint selected={Boolean(value)} /> : null}
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-1.5">
        {interactive ? (
          <LocationLabel value={value} />
        ) : (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <LocateFixed className="size-4 text-primary" />
            موقعیت ثبت‌شده
          </span>
        )}

        {interactive && !value ? (
          <Button
            type="button"
            size="sm"
            className="h-7 shrink-0 rounded-full px-3 text-[11px]"
            onClick={() => selectCenter(inlineMapRef.current)}
          >
            <Check className="size-3.5" />
            انتخاب همین نقطه
          </Button>
        ) : null}

        {!interactive ? <LocationLabel value={value} /> : null}
      </div>

      {error ? <p className="text-xs leading-5 text-destructive">{error}</p> : null}

      {interactive ? (
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent
            showCloseButton={false}
            className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-background px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="min-w-0 text-right">
                <DialogTitle className="text-sm font-bold">انتخاب موقعیت</DialogTitle>
                <DialogDescription className="mt-0.5 text-[11px]">
                  پین را دقیقاً روی زمین موردنظر قرار دهید
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button
                  type="button"
                  aria-label="بستن"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted transition active:scale-90"
                >
                  <X className="size-4" />
                </button>
              </DialogClose>
            </div>

            <div className="relative min-h-0 flex-1">
              {fullscreen ? (
                <ParsimapMap
                  center={value ?? fullscreenCenter}
                  value={value}
                  onChange={onChange}
                  onMapReady={(map) => {
                    fullscreenMapRef.current = map;
                  }}
                  className="h-full"
                  controls={gpsButton}
                />
              ) : null}
            </div>

            <div className="space-y-3 border-t border-border/60 bg-background px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">مختصات</span>
                <LocationLabel value={value} />
              </div>
              {error ? <p className="text-xs leading-5 text-destructive">{error}</p> : null}
              <Button
                type="button"
                className="h-12 w-full rounded-2xl text-sm"
                onClick={() => {
                  if (!value) selectCenter(fullscreenMapRef.current);
                  setFullscreen(false);
                }}
              >
                <Check className="size-4" />
                تایید موقعیت
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

function inlineCenter(map: LeafletMap | null): GeoLocation {
  if (!map) return DEFAULT_MAP_CENTER;
  const point = map.getCenter();
  return normalizeLocation(point.lat, point.lng);
}
