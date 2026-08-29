const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;
const PERSIAN_MONTH_LENGTHS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29] as const;

const persianPartsFormatter = new Intl.DateTimeFormat("en-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export interface PersianDateParts {
  year: number;
  month: number;
  day: number;
}

export function getPersianParts(date: Date): PersianDateParts {
  const parts = persianPartsFormatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);

  return { year, month, day };
}

export function getDaysInPersianMonth(month: number): number {
  return PERSIAN_MONTH_LENGTHS[month - 1] ?? 29;
}

const PERSIAN_LEAP_REMAINDERS = new Set([1, 5, 9, 13, 17, 22, 26, 30]);

function isPersianLeapYear(year: number): boolean {
  return PERSIAN_LEAP_REMAINDERS.has(year % 33);
}

export function getPersianMonthLabel(year: number, month: number): string {
  const anchor = findGregorianForPersian(year, month, 1);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
  }).format(anchor);
}

const DAY_MS = 86_400_000;

export function findGregorianForPersian(
  year: number,
  month: number,
  day: number,
): Date {
  const dayOfYear =
    month <= 6 ? (month - 1) * 31 + day : 186 + (month - 7) * 30 + day;

  const estimated = new Date(year + 621, 2, 21, 12, 0, 0, 0);
  estimated.setDate(estimated.getDate() + dayOfYear - 1);

  for (let delta = 0; delta <= 7; delta += 1) {
    const directions = delta === 0 ? [0] : [-delta, delta];
    for (const shift of directions) {
      const candidate = new Date(estimated);
      if (shift !== 0) candidate.setDate(candidate.getDate() + shift);
      candidate.setHours(12, 0, 0, 0);
      const parts = getPersianParts(candidate);
      if (parts.year === year && parts.month === month && parts.day === day) {
        return candidate;
      }
    }
  }

  const fallbackAnchor = new Date();
  fallbackAnchor.setHours(12, 0, 0, 0);
  for (let offset = -500; offset <= 500; offset += 1) {
    const candidate = new Date(fallbackAnchor);
    candidate.setDate(fallbackAnchor.getDate() + offset);
    const parts = getPersianParts(candidate);
    if (parts.year === year && parts.month === month && parts.day === day) {
      return candidate;
    }
  }

  return fallbackAnchor;
}

const isoCache = new Map<string, string>();

function isoKey(y: number, m: number, d: number): string {
  return `${y}-${m}-${d}`;
}

export function isPersianDatePast(year: number, month: number, day: number): boolean {
  const today = getPersianParts(new Date());
  return (
    year < today.year ||
    (year === today.year && month < today.month) ||
    (year === today.year && month === today.month && day < today.day)
  );
}

export function getPersianMonthLength(year: number, month: number): number {
  if (month < 12) return getDaysInPersianMonth(month);
  return isPersianLeapYear(year) ? 30 : 29;
}

export function getPersianMonthGrid(year: number, month: number) {
  const daysInMonth = getPersianMonthLength(year, month);
  const firstDay = findGregorianForPersian(year, month, 1);
  const startWeekday = (firstDay.getDay() + 1) % 7;

  return {
    daysInMonth,
    startWeekday,
    weekdays: PERSIAN_WEEKDAYS,
  };
}

export function persianDateToIso(year: number, month: number, day: number): string {
  const key = isoKey(year, month, day);
  let iso = isoCache.get(key);
  if (iso !== undefined) return iso;

  const gregorian = findGregorianForPersian(year, month, day);
  const utcYear = String(gregorian.getUTCFullYear()).padStart(4, "0");
  const utcMonth = String(gregorian.getUTCMonth() + 1).padStart(2, "0");
  const utcDay = String(gregorian.getUTCDate()).padStart(2, "0");
  iso = `${utcYear}-${utcMonth}-${utcDay}`;

  if (isoCache.size > 5000) isoCache.clear();
  isoCache.set(key, iso);
  return iso;
}

const chipFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "short",
  day: "numeric",
});

export function formatPersianDayChip(year: number, month: number, day: number): string {
  const date = findGregorianForPersian(year, month, day);
  return chipFormatter.format(date);
}

const isoChipCache = new Map<string, string>();

export function formatPersianIsoChip(iso: string): string {
  let label = isoChipCache.get(iso);
  if (label !== undefined) return label;

  const [yearPart = 0, monthPart = 1, dayPart = 1] = iso
    .split("-")
    .map((part) => Number(part));
  label = chipFormatter.format(new Date(yearPart, monthPart - 1, dayPart, 12));

  if (isoChipCache.size > 2000) isoChipCache.clear();
  isoChipCache.set(iso, label);
  return label;
}
