import { formatRelativeTime } from "@/lib/utils/date";
import { toPersianDigits } from "@/lib/utils/format";

const TIME_ZONE = "Asia/Tehran";
const DAY_MS = 86_400_000;

const keyFormatter = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: TIME_ZONE, year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TIME_ZONE, weekday: "long" });
const dayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: TIME_ZONE });
const yearFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", { timeZone: TIME_ZONE, year: "numeric" });

const jalaliYear = (date: Date) => yearFormatter.format(date).replace(/\D/g, "");

/** «امروز»، «دیروز»، «پنجشنبه ۲۸ آبان»; the year is added only for other years. */
function dayLabel(date: Date, now: Date): string {
  const key = keyFormatter.format(date);
  if (key === keyFormatter.format(now)) return "امروز";
  if (key === keyFormatter.format(new Date(now.getTime() - DAY_MS))) return "دیروز";
  const label = `${weekdayFormatter.format(date)} ${dayFormatter.format(date)}`;
  const year = jalaliYear(date);
  return year === jalaliYear(now) ? label : `${label} ${toPersianDigits(year)}`;
}

export function todayLabel(now = new Date()): string {
  return `${weekdayFormatter.format(now)} ${dayFormatter.format(now)}`;
}

const clockFormatter = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", hour12: false, minute: "2-digit", timeZone: TIME_ZONE });

const isToday = (date: Date, now: Date) => keyFormatter.format(date) === keyFormatter.format(now);

// A phone clock a little behind the server must not say «۲ دقیقه بعد».
const relative = (date: Date, now: Date) => formatRelativeTime(new Date(Math.min(date.getTime(), now.getTime())), now);

/** When a story was added, standalone (home): relative today, then the calendar day. */
export function storyDayLabel(value: string, now = new Date()): string {
  const date = new Date(value);
  return isToday(date, now) ? relative(date, now) : dayLabel(date, now);
}

/** When a story was added, under its day heading: relative today, then just the clock. */
export function storyTimeLabel(value: string, now = new Date()): string {
  const date = new Date(value);
  return isToday(date, now) ? relative(date, now) : `ساعت ${clockFormatter.format(date)}`;
}

/** Splits a newest-first list into Tehran calendar days. */
export function groupNewsByDay<T extends { publishedAt: string }>(
  items: T[],
  now = new Date(),
): Array<{ items: T[]; key: string; label: string }> {
  const groups: Array<{ items: T[]; key: string; label: string }> = [];
  for (const item of items) {
    const date = new Date(item.publishedAt);
    const key = keyFormatter.format(date);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(item);
    else groups.push({ items: [item], key, label: dayLabel(date, now) });
  }
  return groups;
}
