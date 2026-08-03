"use client";

import { useEffect, useState } from "react";

import { formatJalali, formatTime } from "@/lib/utils/date";
import { toPersianDigits } from "@/lib/utils/format";

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const time = formatTime(now);
  const [hours, minutes, seconds] = time.split(":");
  const liveTime = `${toPersianDigits(hours ?? "00")}:${toPersianDigits(minutes ?? "00")}:${toPersianDigits(seconds ?? "00")}`;

  return {
    now,
    dateLabel: formatJalali(now),
    timeLabel: liveTime,
  };
}
