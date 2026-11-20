/**
 * Report periods in the Tehran calendar day. Pure functions only: imported by
 * both the server (queries) and the client (period picker).
 *
 * A day is an ISO date string (`2026-11-19`) naming a Tehran calendar day.
 * Iran has had no DST since 2022, so a fixed +03:30 offset is exact.
 */

export const TEHRAN_OFFSET = "+03:30";
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const DAY_MS = 86_400_000;

/** Longest range a report may cover. */
export const MAX_RANGE_DAYS = 731;

export const PERIOD_PRESETS = ["7d", "30d", "90d", "month", "last_month", "year", "custom"] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  "90d": "۹۰ روز اخیر",
  month: "این ماه",
  last_month: "ماه گذشته",
  year: "امسال",
  custom: "بازه دلخواه",
};

export type Bucket = "day" | "week" | "month";

export interface ReportRange {
  /** Number of days, inclusive of both ends. */
  days: number;
  /** First day (inclusive). */
  from: string;
  /** Last day (inclusive). */
  to: string;
}

export interface ReportPeriod extends ReportRange {
  bucket: Bucket;
  preset: PeriodPreset;
  previous: ReportRange;
}

// ------------------------------------------------------------------ day math

export function dayToUtcNoon(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

export function addDays(day: string, amount: number): string {
  return new Date(dayToUtcNoon(day).getTime() + amount * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dayToUtcNoon(to).getTime() - dayToUtcNoon(from).getTime()) / DAY_MS);
}

/** Today's Tehran calendar day. */
export function tehranToday(now: Date): string {
  return new Date(now.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
}

/** The instant a Tehran day starts. */
export function dayStart(day: string): Date {
  return new Date(`${day}T00:00:00${TEHRAN_OFFSET}`);
}

/** Half-open instant bounds `[start, end)` of a range. */
export function rangeBounds(range: ReportRange): { end: Date; start: Date } {
  return { end: dayStart(addDays(range.to, 1)), start: dayStart(range.from) };
}

// -------------------------------------------------------------- Jalali calendar

const jalaliParts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  day: "numeric",
  month: "numeric",
  timeZone: "UTC",
  year: "numeric",
});

export interface JalaliDate {
  day: number;
  month: number;
  year: number;
}

export function toJalali(day: string): JalaliDate {
  const parts = jalaliParts.formatToParts(dayToUtcNoon(day));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { day: read("day"), month: read("month"), year: read("year") };
}

/** Jalali → ISO day. Estimates from 1 Farvardin ≈ 21 March and corrects with Intl. */
export function fromJalali(date: JalaliDate): string | null {
  if (date.month < 1 || date.month > 12 || date.day < 1 || date.day > 31) return null;
  const dayOfYear = date.month <= 6 ? (date.month - 1) * 31 + date.day : 186 + (date.month - 7) * 30 + date.day;
  const estimate = addDays(`${date.year + 621}-03-21`, dayOfYear - 1);
  for (let shift = 0; shift <= 4; shift += 1) {
    for (const candidate of shift === 0 ? [estimate] : [addDays(estimate, -shift), addDays(estimate, shift)]) {
      const parts = toJalali(candidate);
      if (parts.year === date.year && parts.month === date.month && parts.day === date.day) return candidate;
    }
  }
  return null;
}

/** `1405-08-01` / `۱۴۰۵/۸/۱` → ISO day, or null. */
export function parseJalaliInput(value: string | undefined | null): string | null {
  if (!value) return null;
  const latin = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(latin);
  if (!match) return null;
  return fromJalali({ day: Number(match[3]), month: Number(match[2]), year: Number(match[1]) });
}

/** ISO day → `1405-08-01` (Latin digits, for URLs and inputs). */
export function formatJalaliInput(day: string): string {
  const { day: d, month, year } = toJalali(day);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function jalaliMonthStart(day: string): string {
  return addDays(day, -(toJalali(day).day - 1));
}

function jalaliYearStart(day: string): string {
  const { day: d, month } = toJalali(day);
  const dayOfYear = month <= 6 ? (month - 1) * 31 + d : 186 + (month - 7) * 30 + d;
  return addDays(day, -(dayOfYear - 1));
}

// ---------------------------------------------------------------- resolution

function bucketFor(days: number): Bucket {
  if (days <= 45) return "day";
  if (days <= 200) return "week";
  return "month";
}

function previousOf(range: ReportRange): ReportRange {
  const to = addDays(range.from, -1);
  return { days: range.days, from: addDays(to, -(range.days - 1)), to };
}

export interface PeriodInput {
  from?: string;
  period?: string;
  to?: string;
}

export class ReportPeriodError extends Error {}

/**
 * Turns URL parameters into a concrete range. Bad presets fall back to 30 days;
 * an invalid custom range throws so the caller can explain what is wrong.
 */
export function resolvePeriod(input: PeriodInput, now: Date): ReportPeriod {
  const today = tehranToday(now);
  const preset = (PERIOD_PRESETS as readonly string[]).includes(input.period ?? "")
    ? (input.period as PeriodPreset)
    : "30d";

  let from: string;
  let to = today;
  switch (preset) {
    case "7d":
      from = addDays(today, -6);
      break;
    case "90d":
      from = addDays(today, -89);
      break;
    case "month":
      from = jalaliMonthStart(today);
      break;
    case "last_month":
      to = addDays(jalaliMonthStart(today), -1);
      from = jalaliMonthStart(to);
      break;
    case "year":
      from = jalaliYearStart(today);
      break;
    case "custom": {
      const parsedFrom = parseJalaliInput(input.from);
      const parsedTo = parseJalaliInput(input.to);
      if (!parsedFrom || !parsedTo) throw new ReportPeriodError("تاریخ شروع و پایان را به شکل ۱۴۰۵/۰۸/۰۱ وارد کنید.");
      if (parsedFrom > parsedTo) throw new ReportPeriodError("تاریخ شروع نباید بعد از تاریخ پایان باشد.");
      if (parsedTo > today) throw new ReportPeriodError("تاریخ پایان نمی‌تواند بعد از امروز باشد.");
      if (daysBetween(parsedFrom, parsedTo) + 1 > MAX_RANGE_DAYS) {
        throw new ReportPeriodError("بازه گزارش حداکثر دو سال است.");
      }
      from = parsedFrom;
      to = parsedTo;
      break;
    }
    default:
      from = addDays(today, -29);
  }

  const days = daysBetween(from, to) + 1;
  return { bucket: bucketFor(days), days, from, preset, previous: previousOf({ days, from, to }), to };
}

// ------------------------------------------------------------------- buckets

export interface BucketSlot {
  /** First day of the bucket (inclusive), the key series are joined on. */
  key: string;
  /** Last day of the bucket (inclusive), clipped to the range. */
  last: string;
}

/** Contiguous buckets covering the range: days, 7-day blocks from `from`, or Jalali months. */
export function bucketSlots(period: Pick<ReportPeriod, "bucket" | "from" | "to">): BucketSlot[] {
  const slots: BucketSlot[] = [];
  let cursor = period.from;
  while (cursor <= period.to) {
    let next: string;
    if (period.bucket === "day") next = addDays(cursor, 1);
    else if (period.bucket === "week") next = addDays(cursor, 7);
    else next = jalaliMonthStart(addDays(jalaliMonthStart(cursor), 32));
    const last = addDays(next, -1) < period.to ? addDays(next, -1) : period.to;
    slots.push({ key: cursor, last });
    cursor = next;
  }
  return slots;
}

/** Sums a day-keyed map into the period's buckets. */
export function bucketize(slots: BucketSlot[], daily: Map<string, number>): number[] {
  return slots.map((slot) => {
    let total = 0;
    for (let day = slot.key; day <= slot.last; day = addDays(day, 1)) total += daily.get(day) ?? 0;
    return total;
  });
}

/** Median of a list; null when empty. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}
