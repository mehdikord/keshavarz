"use client";

import { useState } from "react";
import { Crosshair, LoaderCircle, LocateFixed, MapPin } from "lucide-react";

import { MeMapsMap } from "@/components/shared/memaps-map";
import { Button } from "@/components/ui/button";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/defaults";
import {
  DEFAULT_MEMAPS_LAYER,
  MEMAPS_LAYERS,
  type MeMapsLayerId,
} from "@/lib/maps/memaps";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation } from "@/types";

interface MapPickerProps {
  value: GeoLocation | null;
  onChange?: (location: GeoLocation) => void;
  className?: string;
  interactive?: boolean;
  showLayerSwitcher?: boolean;
}

export function MapPicker({
  value,
  onChange,
  className,
  interactive = true,
  showLayerSwitcher = true,
}: MapPickerProps) {
  const [layer, setLayer] = useState<MeMapsLayerId>(DEFAULT_MEMAPS_LAYER);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      setLocationError("مرورگر شما دسترسی به موقعیت مکانی را پشتیبانی نمی‌کند");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange?.({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
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

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
        <MeMapsMap
          center={value ?? DEFAULT_MAP_CENTER}
          value={value}
          onChange={onChange}
          layer={layer}
          interactive={interactive}
        />

        {interactive && showLayerSwitcher ? (
          <div className="absolute left-3 top-3 z-[500] flex rounded-xl border border-white/30 bg-black/45 p-1 text-white shadow-md backdrop-blur-md">
            {(["satellite", "hybrid", "street"] as MeMapsLayerId[]).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLayer(item)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors",
                    layer === item ? "bg-white text-foreground" : "hover:bg-white/15",
                  )}
                >
                  {MEMAPS_LAYERS[item].label}
                </button>
              ),
            )}
          </div>
        ) : null}

        {interactive ? (
          <div className="pointer-events-none absolute bottom-7 right-3 z-[500] rounded-lg bg-black/50 px-2.5 py-1.5 text-[10px] text-white backdrop-blur-sm">
            برای انتخاب، روی زمین موردنظر بزنید
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        {interactive ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGpsClick}
            disabled={locating}
            className="rounded-xl"
          >
            {locating ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
            موقعیت من
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LocateFixed className="size-4 text-primary" />
            موقعیت ثبت‌شده
          </div>
        )}

        {value ? (
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground" dir="ltr">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">
              {toPersianDigits(value.lat)}, {toPersianDigits(value.lng)}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">موقعیت انتخاب نشده</p>
        )}
      </div>

      {locationError ? (
        <p className="text-xs leading-5 text-destructive">{locationError}</p>
      ) : null}
    </div>
  );
}
