"use client";

import { Input, NativeSelect } from "@/components/admin/ui/input";
import { toLatinDigits } from "@/components/admin/catalog/image-field";

export interface DurationValue {
  amount: string;
  unit: "days" | "months";
}

/** A number plus a days/months unit, e.g. «۳ ماه». */
export function DurationField({
  id,
  invalid,
  onChange,
  value,
}: {
  id: string;
  invalid?: boolean;
  onChange: (value: DurationValue) => void;
  value: DurationValue;
}) {
  return (
    <div className="flex gap-2">
      <Input
        aria-invalid={invalid}
        className="w-28 text-left"
        dir="ltr"
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange({ ...value, amount: toLatinDigits(event.target.value).slice(0, 4) })}
        value={value.amount}
      />
      <NativeSelect
        aria-label="واحد مدت"
        className="w-28"
        onChange={(event) => onChange({ ...value, unit: event.target.value as DurationValue["unit"] })}
        value={value.unit}
      >
        <option value="days">روز</option>
        <option value="months">ماه</option>
      </NativeSelect>
    </div>
  );
}

export function durationPayload(value: DurationValue) {
  return { amount: Number(value.amount || 0), unit: value.unit };
}
