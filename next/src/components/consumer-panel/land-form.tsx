"use client";

import { useState } from "react";

import { MapPicker } from "@/components/shared/map-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_MAP_CENTER } from "@/lib/maps/defaults";
import { landFormSchema, type LandFormValues } from "@/lib/validators/land";
import { toLatinDigits } from "@/lib/utils/format";
import type { Land } from "@/types";

interface LandFormProps {
  initialValues?: Partial<Land>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: LandFormValues) => void;
}

export function LandForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: LandFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [areaSqm, setAreaSqm] = useState(
    initialValues?.areaSqm ? String(initialValues.areaSqm) : "",
  );
  const [location, setLocation] = useState(
    initialValues?.location ?? DEFAULT_MAP_CENTER,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = landFormSchema.safeParse({
      title,
      areaSqm: Number(toLatinDigits(areaSqm.replace(/[^\d]/g, ""))),
      location,
      description: initialValues?.description,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان زمین</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 rounded-xl"
          placeholder="مثلاً زمین گندم شمال"
        />
        {errors.title ? (
          <p className="text-xs text-destructive">{errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="areaSqm">متراژ (m²)</Label>
        <Input
          id="areaSqm"
          inputMode="numeric"
          value={areaSqm}
          onChange={(event) => setAreaSqm(event.target.value)}
          className="h-11 rounded-xl"
          placeholder="مثلاً 5000"
        />
        {errors.areaSqm ? (
          <p className="text-xs text-destructive">{errors.areaSqm}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>موقعیت زمین</Label>
        <MapPicker value={location} onChange={setLocation} />
        {errors.location ? (
          <p className="text-xs text-destructive">{errors.location}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="h-11 w-full rounded-xl"
        disabled={isSubmitting}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
