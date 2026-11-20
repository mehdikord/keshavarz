/**
 * Display formatting for the admin console. Everything renders in Persian
 * digits and the Solar Hijri calendar, in Tehran time.
 */

const TIME_ZONE = "Asia/Tehran";

const numberFormatter = new Intl.NumberFormat("fa-IR");
const compactFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 1,
  notation: "compact",
});
const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: TIME_ZONE,
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TIME_ZONE,
  year: "numeric",
});
const dayMonthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});
const weekdayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  timeZone: TIME_ZONE,
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function faNumber(value: number | bigint | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "۰";
  const numeric = typeof value === "string" ? Number(value) : value;
  return numberFormatter.format(numeric as number);
}

export function faCompact(value: number): string {
  return compactFormatter.format(value);
}

export function faDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);
}

/** `1250000` → `۱٬۲۵۰٬۰۰۰ تومان` */
export function formatToman(value: number | string | bigint | null | undefined): string {
  return `${faNumber(value ?? 0)} تومان`;
}

export function formatDate(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : fallback;
}

export function formatShortDate(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date ? shortDateFormatter.format(date) : fallback;
}

export function formatDayMonth(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date ? dayMonthFormatter.format(date) : fallback;
}

export function formatWeekday(value: DateInput): string {
  const date = toDate(value);
  return date ? weekdayFormatter.format(date) : "";
}

export function formatTime(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : fallback;
}

export function formatDateTime(value: DateInput, fallback = "—"): string {
  const date = toDate(value);
  return date ? `${dateFormatter.format(date)}، ساعت ${timeFormatter.format(date)}` : fallback;
}

const RELATIVE_STEPS: Array<[limitSeconds: number, divisor: number, unit: string]> = [
  [60, 1, "ثانیه"],
  [3_600, 60, "دقیقه"],
  [86_400, 3_600, "ساعت"],
  [7 * 86_400, 86_400, "روز"],
  [30 * 86_400, 7 * 86_400, "هفته"],
  [365 * 86_400, 30 * 86_400, "ماه"],
  [Number.POSITIVE_INFINITY, 365 * 86_400, "سال"],
];

/** `۳ ساعت پیش` / `۲ روز دیگر` */
export function formatRelative(value: DateInput, now: Date = new Date(), fallback = "—"): string {
  const date = toDate(value);
  if (!date) return fallback;
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const absolute = Math.abs(diffSeconds);
  if (absolute < 45) return "همین حالا";
  for (const [limit, divisor, unit] of RELATIVE_STEPS) {
    if (absolute < limit) {
      const amount = Math.max(1, Math.floor(absolute / divisor));
      return `${faNumber(amount)} ${unit} ${diffSeconds >= 0 ? "پیش" : "دیگر"}`;
    }
  }
  return fallback;
}

/** `09123456789` → `۰۹۱۲ ۳۴۵ ۶۷۸۹` */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return faDigits(`${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`);
  }
  return faDigits(phone);
}

/** Square metres → a short human area (`۲٫۵ هکتار` / `۸۰۰ متر مربع`). */
export function formatArea(squareMeters: number | string | null | undefined): string {
  const value = Number(squareMeters ?? 0);
  if (value >= 10_000) {
    return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(value / 10_000)} هکتار`;
  }
  return `${faNumber(Math.round(value))} متر مربع`;
}

/** Signed percentage change between two periods; `null` when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: fractionDigits }).format(Math.abs(value))}٪`;
}

/**
 * Avatar monogram. Persian letters join, so two initials read like a word
 * ("کک"); a single letter is clearer. Latin names keep two initials.
 */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  const first = parts[0]!;
  if (/^[A-Za-z]/.test(first)) {
    const last = parts.length > 1 ? parts[parts.length - 1]![0] : "";
    return `${first[0]}${last}`.toUpperCase();
  }
  return first[0]!;
}
