"use client";

import { CalendarDays, Clock3 } from "lucide-react";

import { useLiveClock } from "@/hooks/use-live-clock";
import { cn } from "@/lib/utils";

interface LiveClockProps {
  className?: string;
  variant?: "light" | "dark";
}

export function LiveClock({ className, variant = "dark" }: LiveClockProps) {
  const { dateLabel, timeLabel } = useLiveClock();
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 backdrop-blur-md",
        isLight
          ? "border-[#183f31]/15 bg-white/25 text-[#102f24]"
          : "border-border/70 bg-surface/80 text-foreground shadow-sm",
        className,
      )}
    >
      <div className="absolute -left-4 -top-4 size-16 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 text-xs opacity-80">
            <CalendarDays className="size-3.5" />
            <span>{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock3 className="size-4 opacity-80" />
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {timeLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
