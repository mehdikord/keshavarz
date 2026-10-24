"use client";

import Image from "next/image";
import { MapPin, Moon, Sprout, Sun, Sunrise, Sunset } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { FieldHills } from "@/components/shared/field-hills";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useLiveClock } from "@/hooks/use-live-clock";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { getWeatherIconUrl } from "@/lib/weather/client";
import type { WeatherForecastResponse } from "@/types/weather";

type DayPart = "morning" | "noon" | "evening" | "night";

function getDayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "evening";
  return "night";
}

const GREETINGS: Record<DayPart, { label: string; icon: typeof Sun }> = {
  morning: { label: "صبح بخیر", icon: Sunrise },
  noon: { label: "ظهر بخیر", icon: Sun },
  evening: { label: "عصر بخیر", icon: Sunset },
  night: { label: "شب بخیر", icon: Moon },
};

const POLLEN = [
  { left: "8%", size: 4, delay: "0s", duration: "11s" },
  { left: "22%", size: 3, delay: "3s", duration: "9s" },
  { left: "41%", size: 5, delay: "6s", duration: "13s" },
  { left: "58%", size: 3, delay: "1.5s", duration: "10s" },
  { left: "74%", size: 4, delay: "4.5s", duration: "12s" },
  { left: "90%", size: 3, delay: "7s", duration: "9.5s" },
];

const STARS = [
  { top: "14%", left: "18%", delay: "0s" },
  { top: "9%", left: "46%", delay: "1.2s" },
  { top: "22%", left: "62%", delay: "2.1s" },
  { top: "12%", left: "84%", delay: "0.6s" },
  { top: "30%", left: "35%", delay: "1.7s" },
  { top: "26%", left: "92%", delay: "2.6s" },
];

interface HomeHeroProps {
  name: string;
  avatarSrc?: string | null;
  weather: WeatherForecastResponse | null;
  weatherLoading: boolean;
}

export function HomeHero({
  name,
  avatarSrc,
  weather,
  weatherLoading,
}: HomeHeroProps) {
  const { now, dateLabel, timeLabel } = useLiveClock();
  const dayPart = getDayPart(now.getHours());
  const isNight = dayPart === "night";
  const greeting = GREETINGS[dayPart];
  const GreetingIcon = greeting.icon;
  const [hours, minutes] = timeLabel.split(":");
  const seconds = toPersianDigits(String(now.getSeconds()).padStart(2, "0"));

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(165deg,#071d14_0%,#0f3324_42%,#1b5038_78%,#24603f_100%)] text-white">
      {/* Sky: sun glow by day, moon and stars by night */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
        {isNight ? (
          <>
            <div className="absolute -top-20 -left-16 size-64 rounded-full bg-[radial-gradient(circle,rgba(183,228,199,0.22),transparent_65%)]" />
            <div className="absolute top-24 left-8 size-11 rounded-full bg-[#eef6e8] shadow-[inset_-9px_-3px_0_0_#c9dcc4,0_0_40px_10px_rgba(216,243,220,0.25)]" />
            {STARS.map((star) => (
              <span
                key={`${star.top}-${star.left}`}
                className="animate-twinkle absolute size-[3px] rounded-full bg-white"
                style={{ top: star.top, left: star.left, animationDelay: star.delay }}
              />
            ))}
          </>
        ) : (
          <>
            <div className="absolute -top-24 -left-20 size-80 rounded-full bg-[radial-gradient(circle,rgba(255,209,128,0.45)_0%,rgba(244,162,97,0.14)_42%,transparent_68%)]" />
            <div
              className={cn(
                "animate-sun-glow absolute left-10 size-11 rounded-full bg-gradient-to-br from-[#fff1c1] via-[#ffd27f] to-[#f4a261]",
                dayPart === "evening" ? "top-36" : "top-24",
              )}
            />
          </>
        )}
        <div className="absolute -right-24 top-10 size-72 rounded-full bg-[#40916c]/25 blur-3xl" />
        {POLLEN.map((p) => (
          <span
            key={p.left}
            className="animate-pollen absolute bottom-16 rounded-full bg-[#d8f3dc]"
            style={{
              left: p.left,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="relative px-5 pb-20 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#95d5b2] to-[#40916c] text-[#0b2a1c] shadow-[0_8px_24px_-6px_rgba(149,213,178,0.55)]">
              <Sprout className="size-6" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-black tracking-tight">کشاورز</p>
              <p className="text-[10.5px] font-medium text-white/60">
                پلتفرم هوشمند خدمات کشاورزی
              </p>
            </div>
          </div>
          <AppMenuTrigger className="size-11 rounded-2xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-white" />
        </header>

        <div className="mt-8 flex items-center gap-3.5">
          <div className="rounded-full bg-gradient-to-br from-[#b7e4c7] to-[#f4a261] p-[2px]">
            <UserAvatar
              name={name}
              src={avatarSrc}
              size="lg"
              className="border-2 border-[#0f3324]"
            />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#b7e4c7]">
              <GreetingIcon className="size-4" strokeWidth={2} />
              {greeting.label}
            </p>
            <h1 className="truncate text-[26px] font-black leading-snug tracking-tight">
              {name}
            </h1>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[26px] bg-white/[0.07] p-4 ring-1 ring-white/12 backdrop-blur-xl">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-white/60">{dateLabel}</p>
            <p
              dir="ltr"
              className="mt-1 flex items-baseline justify-end gap-1 font-black tabular-nums leading-none"
            >
              <span className="text-[32px] tracking-tight">
                {hours}:{minutes}
              </span>
              <span className="w-5 text-sm font-bold text-[#95d5b2]">{seconds}</span>
            </p>
          </div>

          <span aria-hidden className="h-12 w-px bg-white/15" />

          <div className="flex min-w-0 items-center justify-end gap-2">
            {weatherLoading ? (
              <div className="w-full space-y-2">
                <div className="ms-auto h-6 w-14 animate-pulse rounded-lg bg-white/15" />
                <div className="ms-auto h-3 w-20 animate-pulse rounded bg-white/10" />
              </div>
            ) : weather ? (
              <>
                <div className="min-w-0 text-left">
                  <p className="text-[28px] font-black leading-none tabular-nums">
                    {toPersianDigits(Math.round(weather.current.temp_c))}°
                  </p>
                  <p className="mt-1.5 flex items-center justify-end gap-1 truncate text-[11px] text-white/65">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{weather.location.name}</span>
                  </p>
                </div>
                <div className="relative size-12 shrink-0">
                  <Image
                    src={getWeatherIconUrl(weather.current.condition.icon)}
                    alt={weather.current.condition.text}
                    fill
                    sizes="48px"
                    className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
                    unoptimized
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-white/55">آب‌وهوا در دسترس نیست</p>
            )}
          </div>
        </div>
      </div>

      <FieldHills />
    </section>
  );
}
