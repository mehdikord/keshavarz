import { faNumber, formatDayMonth, formatToman } from "@/lib/admin/format";
import type { Bucket } from "@/server/modules/admin/reports/report-period";

const monthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  timeZone: "Asia/Tehran",
  year: "numeric",
});
const monthOnlyFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "long",
  timeZone: "Asia/Tehran",
});
const fullDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  day: "numeric",
  month: "long",
  timeZone: "Asia/Tehran",
  year: "numeric",
});

const atNoon = (day: string) => `${day}T12:00:00+03:30`;

export function formatDay(day: string): string {
  return fullDateFormatter.format(new Date(atNoon(day)));
}

/** Short axis label for a bucket. */
export function bucketTick(key: string, bucket: Bucket): string {
  if (bucket === "month") return monthOnlyFormatter.format(new Date(atNoon(key)));
  return formatDayMonth(atNoon(key));
}

/** Full label for a bucket, used in tooltips. */
export function bucketLabel(key: string, last: string, bucket: Bucket): string {
  if (bucket === "day") return formatDay(key);
  if (bucket === "month") {
    const parts = monthFormatter.formatToParts(new Date(atNoon(key)));
    const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    return `${read("month")} ${read("year")}`;
  }
  return `${formatDayMonth(atNoon(key))} تا ${formatDayMonth(atNoon(last))}`;
}

const decimal = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });

export function faDecimal(value: number): string {
  return decimal.format(value);
}

/** A duration in seconds as the largest sensible unit: «۴ دقیقه»، «۲٫۵ ساعت»، «۳ روز». */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${faNumber(Math.round(seconds))} ثانیه`;
  if (seconds < 3600) return `${decimal.format(seconds / 60)} دقیقه`;
  if (seconds < 86_400) return `${decimal.format(seconds / 3600)} ساعت`;
  return `${decimal.format(seconds / 86_400)} روز`;
}

export type ValueKind = "count" | "money" | "percent" | "duration" | "decimal";

export function formatValue(kind: ValueKind, value: number | null): string {
  if (value === null) return "—";
  switch (kind) {
    case "money":
      return formatToman(Math.round(value));
    case "percent":
      return `${decimal.format(value)}٪`;
    case "duration":
      return formatDuration(value);
    case "decimal":
      return decimal.format(value);
    default:
      return faNumber(Math.round(value));
  }
}

const compact = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1, notation: "compact" });

/** Axis tick: full under 10,000, compact above. */
export function axisTick(value: number): string {
  return Math.abs(value) < 10_000 ? faNumber(value) : compact.format(value);
}
