"use client";

import Image from "next/image";
import {
  Droplets,
  LoaderCircle,
  LocateFixed,
  MapPin,
  RotateCw,
  SprayCan,
  Sun,
  Sunrise,
  Sunset,
  Umbrella,
  Wind,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { getWeatherIconUrl } from "@/lib/weather/client";
import type { WeatherCurrent, WeatherForecastResponse } from "@/types/weather";

type Tone = "good" | "warn" | "bad";

interface Advice {
  tone: Tone;
  status: string;
  reason: string;
}

const TONE_STYLES: Record<Tone, string> = {
  good: "bg-[#d8f3dc] text-[#1b5e3b]",
  warn: "bg-[#fdefd6] text-[#9a5b13]",
  bad: "bg-[#fde2dc] text-[#b23a1f]",
};

const WIND_DIRS: Record<string, string> = {
  N: "شمالی", NNE: "شمالی", NE: "شمال‌شرقی", ENE: "شرقی",
  E: "شرقی", ESE: "شرقی", SE: "جنوب‌شرقی", SSE: "جنوبی",
  S: "جنوبی", SSW: "جنوبی", SW: "جنوب‌غربی", WSW: "غربی",
  W: "غربی", WNW: "غربی", NW: "شمال‌غربی", NNW: "شمالی",
};

/** Rule-of-thumb guidance; thresholds follow common field-spraying practice. */
function getSprayAdvice(current: WeatherCurrent, rainChance: number): Advice {
  if (current.wind_kph > 15) {
    return { tone: "bad", status: "نامناسب", reason: "باد شدید؛ خطر بادبردگی سم" };
  }
  if (rainChance >= 50) {
    return { tone: "bad", status: "نامناسب", reason: "احتمال بارش و شسته‌شدن سم" };
  }
  if (current.temp_c >= 30) {
    return { tone: "warn", status: "با احتیاط", reason: "هوای گرم؛ صبح زود یا عصر" };
  }
  return { tone: "good", status: "مناسب", reason: "باد ملایم و هوای پایدار" };
}

function getIrrigationAdvice(current: WeatherCurrent, rainChance: number): Advice {
  if (rainChance >= 60) {
    return { tone: "warn", status: "تعویق", reason: "بارش در راه است" };
  }
  if (current.temp_c >= 30 || current.humidity < 30) {
    return { tone: "warn", status: "صبح یا عصر", reason: "تبخیر بالا در ساعات گرم" };
  }
  return { tone: "good", status: "عادی", reason: "شرایط معمول آبیاری" };
}

/** "06:12 AM" → "۰۶:۱۲" */
function formatAstroTime(value: string): string {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return toPersianDigits(value);
  let hour = Number(match[1]) % 12;
  if (match[3]?.toUpperCase() === "PM") hour += 12;
  return toPersianDigits(`${String(hour).padStart(2, "0")}:${match[2]}`);
}

function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "short" }).format(
    new Date(`${date}T12:00:00`),
  );
}

interface FieldWeatherCardProps {
  data: WeatherForecastResponse | null;
  loading: boolean;
  locating: boolean;
  error: string | null;
  onRetry: () => void;
  onLocate: () => void;
}

export function FieldWeatherCard({
  data,
  loading,
  locating,
  error,
  onRetry,
  onLocate,
}: FieldWeatherCardProps) {
  return (
    <section aria-labelledby="field-weather-title" className="px-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2 id="field-weather-title" className="text-[15px] font-black text-foreground">
            هوای مزرعه
          </h2>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {data
                ? `${data.location.name}${data.location.region ? `، ${data.location.region}` : ""}`
                : loading
                  ? "در حال دریافت..."
                  : "موقعیت نامشخص"}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onLocate}
          disabled={loading || locating}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
        >
          {locating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LocateFixed className="size-4" />
          )}
          موقعیت من
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[30px] bg-surface shadow-[0_18px_40px_-24px_rgba(45,106,79,0.45)] ring-1 ring-border/60">
        {loading ? (
          <WeatherSkeleton />
        ) : error || !data ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Sun className="size-6" />
            </span>
            <p className="text-sm text-muted-foreground">{error ?? "اطلاعات آب‌وهوا در دسترس نیست"}</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <RotateCw className="size-3.5" />
              تلاش مجدد
            </button>
          </div>
        ) : (
          <WeatherBody data={data} />
        )}
      </div>
    </section>
  );
}

function WeatherBody({ data }: { data: WeatherForecastResponse }) {
  const { current, forecast } = data;
  const today = forecast.forecastday[0];
  const rainChance = today?.day.daily_chance_of_rain ?? 0;
  const isDay = current.is_day === 1;
  const spray = getSprayAdvice(current, rainChance);
  const irrigation = getIrrigationAdvice(current, rainChance);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden px-5 pb-5 pt-5",
          isDay
            ? "bg-[linear-gradient(160deg,#e3f4ff_0%,#eef8f0_60%,transparent_100%)]"
            : "bg-[linear-gradient(160deg,#dfe6f3_0%,#eef3ee_60%,transparent_100%)]",
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -left-8 -top-10 size-40 rounded-full blur-2xl",
            isDay ? "bg-[#ffd27f]/40" : "bg-[#a5b4fc]/30",
          )}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p
              dir="ltr"
              className="flex items-start justify-end font-black leading-none tabular-nums text-foreground"
            >
              <span className="text-[56px] tracking-tighter">
                {toPersianDigits(Math.round(current.temp_c))}
              </span>
              <span className="mt-1 text-2xl text-primary">°</span>
            </p>
            <p className="mt-2 text-sm font-bold text-foreground/85">{current.condition.text}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              احساس {toPersianDigits(Math.round(current.feelslike_c))}°
              {today ? (
                <>
                  {" · "}
                  بیشینه {toPersianDigits(Math.round(today.day.maxtemp_c))}° / کمینه{" "}
                  {toPersianDigits(Math.round(today.day.mintemp_c))}°
                </>
              ) : null}
            </p>
          </div>
          <div className="relative size-24 shrink-0">
            <Image
              src={getWeatherIconUrl(current.condition.icon)}
              alt={current.condition.text}
              fill
              sizes="96px"
              className="object-contain drop-shadow-[0_10px_18px_rgba(45,106,79,0.25)]"
              unoptimized
            />
          </div>
        </div>

        {today ? (
          <div className="relative mt-4 flex items-center gap-4 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Sunrise className="size-3.5 text-[#e08a2b]" />
              طلوع {formatAstroTime(today.astro.sunrise)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Sunset className="size-3.5 text-[#b4661a]" />
              غروب {formatAstroTime(today.astro.sunset)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-2 px-4">
        <Metric icon={Umbrella} tint="text-sky-600 bg-sky-50" label="بارش" value={`${toPersianDigits(rainChance)}٪`} />
        <Metric icon={Droplets} tint="text-cyan-600 bg-cyan-50" label="رطوبت" value={`${toPersianDigits(current.humidity)}٪`} />
        <Metric
          icon={Wind}
          tint="text-emerald-700 bg-emerald-50"
          label={WIND_DIRS[current.wind_dir] ?? "باد"}
          value={toPersianDigits(Math.round(current.wind_kph))}
          unit="km/h"
        />
        <Metric icon={Sun} tint="text-amber-600 bg-amber-50" label="شاخص UV" value={toPersianDigits(current.uv)} />
      </div>

      <div className="mt-4 space-y-2 px-4">
        <AdviceRow icon={SprayCan} title="سم‌پاشی" advice={spray} />
        <AdviceRow icon={Droplets} title="آبیاری" advice={irrigation} />
      </div>

      {forecast.forecastday.length > 1 ? (
        <div className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-5">
          {forecast.forecastday.map((day, index) => (
            <div
              key={day.date}
              className={cn(
                "flex min-w-[76px] flex-1 snap-start flex-col items-center gap-1 rounded-2xl px-2 py-3",
                index === 0
                  ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-10px_rgba(45,106,79,0.8)]"
                  : "bg-muted/60 text-foreground",
              )}
            >
              <span className="text-[11px] font-bold">
                {index === 0 ? "امروز" : formatWeekday(day.date)}
              </span>
              <span className="relative size-9">
                <Image
                  src={getWeatherIconUrl(day.day.condition.icon)}
                  alt={day.day.condition.text}
                  fill
                  sizes="36px"
                  className="object-contain"
                  unoptimized
                />
              </span>
              <span className="text-xs font-black tabular-nums">
                {toPersianDigits(Math.round(day.day.maxtemp_c))}°
                <span className={cn("ms-1 font-medium", index === 0 ? "text-white/65" : "text-muted-foreground")}>
                  {toPersianDigits(Math.round(day.day.mintemp_c))}°
                </span>
              </span>
              {day.day.daily_chance_of_rain > 0 ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                    index === 0 ? "text-sky-100" : "text-sky-600",
                  )}
                >
                  <Umbrella className="size-2.5" />
                  {toPersianDigits(day.day.daily_chance_of_rain)}٪
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-5" />
      )}
    </>
  );
}

function Metric({
  icon: Icon,
  tint,
  label,
  value,
  unit,
}: {
  icon: typeof Sun;
  tint: string;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-background px-1 py-3 ring-1 ring-border/50">
      <span className={cn("flex size-8 items-center justify-center rounded-xl", tint)}>
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="text-sm font-black leading-none tabular-nums text-foreground">
        {value}
        {unit ? <span className="ms-0.5 text-[9px] font-semibold text-muted-foreground">{unit}</span> : null}
      </span>
      <span className="truncate text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function AdviceRow({
  icon: Icon,
  title,
  advice,
}: {
  icon: typeof Sun;
  title: string;
  advice: Advice;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background px-3 py-2.5 ring-1 ring-border/50">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", TONE_STYLES[advice.tone])}>
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-foreground">پیشنهاد {title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{advice.reason}</p>
      </div>
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black", TONE_STYLES[advice.tone])}>
        {advice.status}
      </span>
    </div>
  );
}

function WeatherSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="size-20 rounded-3xl" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </div>
  );
}
