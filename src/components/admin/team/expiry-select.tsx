"use client";

import { NativeSelect } from "@/components/admin/ui/input";

export const EXPIRY_OPTIONS = [
  { days: 0, label: "بدون انقضا" },
  { days: 1, label: "۱ روز" },
  { days: 7, label: "۷ روز" },
  { days: 30, label: "۳۰ روز" },
  { days: 90, label: "۹۰ روز" },
  { days: 180, label: "۶ ماه" },
  { days: 365, label: "یک سال" },
] as const;

/** Temporary access is picked as a duration, which avoids a Gregorian date picker. */
export function expiryFromDays(days: number): string | null {
  return days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
}

export function ExpirySelect({
  className,
  id,
  keepLabel,
  onChange,
  value,
}: {
  className?: string;
  id?: string;
  /** Extra first option that keeps the current expiry (value -1). */
  keepLabel?: string;
  onChange: (days: number) => void;
  value: number;
}) {
  return (
    <NativeSelect className={className} id={id} onChange={(event) => onChange(Number(event.target.value))} value={String(value)}>
      {keepLabel ? <option value="-1">{keepLabel}</option> : null}
      {EXPIRY_OPTIONS.map((option) => (
        <option key={option.days} value={option.days}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}
