"use client";

import Image from "next/image";
import { Droplets, SprayCan, Umbrella, Wind } from "lucide-react";

import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import {
  ADVICE_TONE_STYLES,
  getIrrigationAdvice,
  getSprayAdvice,
  type FieldAdvice,
} from "@/lib/weather/advice";
import { getWeatherIconUrl } from "@/lib/weather/client";
import type { WeatherForecastResponse } from "@/types/weather";

interface LandWeatherCardProps {
  landTitle: string;
  weather: WeatherForecastResponse | null;
  loading: boolean;
}

export function LandWeatherCard({ landTitle, weather, loading }: LandWeatherCardProps) {
  if (loading) {
    return <div className="h-48 animate-pulse rounded-[26px] bg-white/70 ring-1 ring-[#efe0c8]" />;
  }
  if (!weather) return null;

  const { current } = weather;
  const rainChance = weather.forecast.forecastday[0]?.day.daily_chance_of_rain ?? 0;
  const spray = getSprayAdvice(current, rainChance);
  const irrigation = getIrrigationAdvice(current, rainChance);

  return (
    <section
      aria-labelledby="land-weather-title"
      className="overflow-hidden rounded-[26px] bg-white shadow-[0_14px_30px_-22px_rgba(160,86,26,0.45)] ring-1 ring-[#efe0c8]"
    >
      <div className="flex items-center gap-3 bg-[linear-gradient(160deg,#e6f3fb_0%,#fff8ea_80%)] p-4">
        <div className="min-w-0 flex-1">
          <h2 id="land-weather-title" className="text-[12px] font-bold text-[#8a6a48]">
            هوای زمین «{landTitle}»
          </h2>
          <p className="mt-1 flex items-baseline gap-2">
            <span dir="ltr" className="text-[34px] font-black leading-none tabular-nums text-[#3b2410]">
              {toPersianDigits(Math.round(current.temp_c))}°
            </span>
            <span className="truncate text-[13px] font-bold text-[#5c4120]">{current.condition.text}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-[#8a6a48]">
            <span className="inline-flex items-center gap-1">
              <Umbrella className="size-3.5 text-sky-600" />
              بارش {toPersianDigits(rainChance)}٪
            </span>
            <span className="inline-flex items-center gap-1">
              <Droplets className="size-3.5 text-cyan-600" />
              رطوبت {toPersianDigits(current.humidity)}٪
            </span>
            <span className="inline-flex items-center gap-1">
              <Wind className="size-3.5 text-emerald-700" />
              باد {toPersianDigits(Math.round(current.wind_kph))} km/h
            </span>
          </div>
        </div>
        <div className="relative size-20 shrink-0">
          <Image
            src={getWeatherIconUrl(current.condition.icon)}
            alt={current.condition.text}
            fill
            sizes="80px"
            className="object-contain drop-shadow-[0_8px_14px_rgba(160,86,26,0.25)]"
            unoptimized
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <AdviceTile icon={SprayCan} title="سم‌پاشی" advice={spray} />
        <AdviceTile icon={Droplets} title="آبیاری" advice={irrigation} />
      </div>
    </section>
  );
}

function AdviceTile({ icon: Icon, title, advice }: { icon: typeof Wind; title: string; advice: FieldAdvice }) {
  return (
    <div className="rounded-2xl bg-[#fcf7ee] p-3 ring-1 ring-[#f1e6d6]">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#5c4120]">
          <Icon className="size-4" />
          {title}
        </span>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", ADVICE_TONE_STYLES[advice.tone])}>
          {advice.status}
        </span>
      </div>
      <p className="mt-1.5 text-[10.5px] leading-4 text-[#8a6a48]">{advice.reason}</p>
    </div>
  );
}
