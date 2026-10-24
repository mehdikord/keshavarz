export function formatJalali(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatJalaliShort(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "۵ دقیقه پیش", "دیروز", … — falls back to "همین حالا" under a minute. */
export function formatRelativeTime(value: string | Date, now = new Date()): string {
  const seconds = (new Date(value).getTime() - now.getTime()) / 1000;
  const formatter = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= size) {
      if (unit === "day" && Math.abs(seconds) >= 7 * size) {
        return formatJalaliShort(new Date(value));
      }
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return "همین حالا";
}
