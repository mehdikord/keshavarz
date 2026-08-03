const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export interface PersianDateParts {
  year: number;
  month: number;
  day: number;
}

export function getPersianParts(date: Date): PersianDateParts {
  const formatter = new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);

  return { year, month, day };
}

export function getPersianMonthLabel(year: number, month: number): string {
  const anchor = findGregorianForPersian(year, month, 1);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
  }).format(anchor);
}

export function getPersianDaysInMonth(month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return 29;
}

export function findGregorianForPersian(
  year: number,
  month: number,
  day: number,
): Date {
  const anchor = new Date();
  anchor.setHours(12, 0, 0, 0);

  for (let offset = -500; offset <= 500; offset += 1) {
    const candidate = new Date(anchor);
    candidate.setDate(anchor.getDate() + offset);
    const parts = getPersianParts(candidate);

    if (parts.year === year && parts.month === month && parts.day === day) {
      return candidate;
    }
  }

  return anchor;
}

export function getPersianMonthGrid(year: number, month: number) {
  const daysInMonth = getPersianDaysInMonth(month);
  const firstDay = findGregorianForPersian(year, month, 1);
  const startWeekday = (firstDay.getDay() + 1) % 7;

  return {
    daysInMonth,
    startWeekday,
    weekdays: PERSIAN_WEEKDAYS,
  };
}

export function persianDateToIso(year: number, month: number, day: number): string {
  return findGregorianForPersian(year, month, day).toISOString();
}

export function formatPersianDayChip(year: number, month: number, day: number): string {
  const date = findGregorianForPersian(year, month, day);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "short",
    day: "numeric",
  }).format(date);
}
