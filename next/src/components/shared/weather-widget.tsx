"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Droplets,
  Loader2,
  MapPin,
  Navigation,
  Sun,
  Wind,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWeather, getWeatherIconUrl } from "@/lib/weather/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import type { WeatherForecastResponse } from "@/types/weather";

interface WeatherWidgetProps {
  className?: string;
}

function formatForecastDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function WeatherSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/20" />
          <Skeleton className="h-10 w-20 bg-white/20" />
          <Skeleton className="h-4 w-32 bg-white/20" />
        </div>
        <Skeleton className="size-16 rounded-2xl bg-white/20" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-14 rounded-xl bg-white/20" />
        <Skeleton className="h-14 rounded-xl bg-white/20" />
        <Skeleton className="h-14 rounded-xl bg-white/20" />
      </div>
    </div>
  );
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = useCallback(
    async (coords?: { lat: number; lng: number }, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await fetchWeather(
          coords ? { lat: coords.lat, lng: coords.lng } : {},
        );
        setData(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "خطا در دریافت آب‌وهوا";
        setError(message);
        toast.error("آب‌وهوا", message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitialWeather() {
      try {
        const result = await fetchWeather({});
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "خطا در دریافت آب‌وهوا";
          setError(message);
          toast.error("آب‌وهوا", message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("موقعیت‌یابی در این مرورگر پشتیبانی نمی‌شود");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }).finally(() => setLocating(false));
        toast.success("موقعیت دریافت شد", "آب‌وهمای منطقه شما به‌روزرسانی شد");
      },
      (geoError) => {
        setLocating(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          toast.error("دسترسی به موقعیت رد شد", "لطفاً مجوز موقعیت را فعال کنید");
          return;
        }
        toast.error("خطا در دریافت موقعیت");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const current = data?.current;
  const location = data?.location;
  const forecastDays = data?.forecast.forecastday ?? [];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1e4d3a] via-[#2d6a4f] to-[#40916c] text-white shadow-lg",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-8 size-44 rounded-full bg-[#95d5b2]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_40%)]" />
      </div>

      <div className="relative p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-white/75">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {loading
                  ? "در حال دریافت..."
                  : location
                    ? `${location.name}${location.region ? `، ${location.region}` : ""}`
                    : "موقعیت نامشخص"}
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9 shrink-0 rounded-xl border-0 bg-white/15 text-white hover:bg-white/25"
            onClick={handleLocate}
            disabled={loading || locating}
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Navigation className="size-4" />
            )}
            موقعیت من
          </Button>
        </div>

        {loading ? (
          <WeatherSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-white/15 bg-black/10 p-4 text-center">
            <p className="text-sm text-white/85">{error}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 bg-white/15 text-white hover:bg-white/25"
              onClick={() => void loadWeather()}
            >
              تلاش مجدد
            </Button>
          </div>
        ) : current && location ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold leading-none tabular-nums">
                    {toPersianDigits(Math.round(current.temp_c))}
                  </span>
                  <span className="mb-1 text-2xl font-medium text-white/80">°</span>
                </div>
                <p className="mt-2 text-base font-medium text-white/90">
                  {current.condition.text}
                </p>
                <p className="mt-1 text-xs text-white/65">
                  احساس {toPersianDigits(Math.round(current.feelslike_c))}°
                </p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="relative size-20 overflow-hidden rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
                  <Image
                    src={getWeatherIconUrl(current.condition.icon)}
                    alt={current.condition.text}
                    fill
                    className="object-contain p-1"
                    sizes="80px"
                    unoptimized
                  />
                </div>
                <span className="text-[10px] text-white/60">
                  UV {toPersianDigits(current.uv)}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <MetricPill
                icon={Droplets}
                label="رطوبت"
                value={`${toPersianDigits(current.humidity)}٪`}
              />
              <MetricPill
                icon={Wind}
                label="باد"
                value={`${toPersianDigits(Math.round(current.wind_kph))} km/h`}
              />
              <MetricPill
                icon={Sun}
                label="جهت"
                value={current.wind_dir}
              />
            </div>

            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/15"
            >
              {expanded ? "بستن پیش‌بینی" : "پیش‌بینی روزهای آینده"}
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                expanded
                  ? "mt-4 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-black/10 p-3">
                  {forecastDays.map((day, index) => (
                    <div
                      key={day.date}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5",
                        index === 0 && "bg-white/5",
                      )}
                    >
                      <div className="min-w-[88px] text-xs font-medium text-white/85">
                        {index === 0 ? "امروز" : formatForecastDate(day.date)}
                      </div>
                      <div className="relative size-10 shrink-0">
                        <Image
                          src={getWeatherIconUrl(day.day.condition.icon)}
                          alt={day.day.condition.text}
                          fill
                          className="object-contain"
                          sizes="40px"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white/80">
                          {day.day.condition.text}
                        </p>
                        {day.day.daily_chance_of_rain > 0 ? (
                          <p className="text-[10px] text-sky-200/80">
                            احتمال بارش {toPersianDigits(day.day.daily_chance_of_rain)}٪
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-sm tabular-nums">
                        <span className="font-semibold">
                          {toPersianDigits(Math.round(day.day.maxtemp_c))}°
                        </span>
                        <span className="text-white/50">
                          {toPersianDigits(Math.round(day.day.mintemp_c))}°
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-1 text-[10px] text-white/65">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
