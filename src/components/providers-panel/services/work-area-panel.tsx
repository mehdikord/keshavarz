"use client";

import { AlertTriangle, Check, CircleCheck, LoaderCircle, Radar } from "lucide-react";

import { MapPicker } from "@/components/shared/map-picker";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import type { GeoLocation } from "@/types";

export const MIN_RADIUS_KM = 20;
export const MAX_RADIUS_KM = 100;
const RADIUS_PRESETS = [20, 30, 50, 75, 100];

interface WorkAreaPanelProps {
  configured: boolean;
  center: GeoLocation | null;
  radiusKm: number;
  dirty: boolean;
  saving: boolean;
  onCenterChange: (location: GeoLocation) => void;
  onRadiusChange: (radiusKm: number) => void;
  onSave: () => void;
}

export function WorkAreaPanel({
  configured,
  center,
  radiusKm,
  dirty,
  saving,
  onCenterChange,
  onRadiusChange,
  onSave,
}: WorkAreaPanelProps) {
  const coverageKm2 = Math.round(Math.PI * radiusKm * radiusKm);

  return (
    <div className="space-y-4">
      {configured ? (
        <div className="flex items-center gap-3 rounded-[22px] bg-[#d8f3dc]/70 px-4 py-3 ring-1 ring-[#95d5b2]/50">
          <CircleCheck className="size-5 shrink-0 text-[#2d6a4f]" />
          <p className="text-[12px] leading-5 text-[#1b4332]">
            محدوده کاری ثبت شده است. کشاورزانی که زمینشان در این محدوده باشد شما را می‌بینند.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-[22px] bg-[#fdefd6] px-4 py-3 ring-1 ring-[#e9c46a]/50">
          <AlertTriangle className="size-5 shrink-0 text-[#b4661a]" />
          <p className="text-[12px] leading-5 text-[#6b4210]">
            تا محدوده کاری را ثبت نکنید، در جستجوی کشاورزان نمایش داده نمی‌شوید.
          </p>
        </div>
      )}

      <section className="rounded-[26px] bg-surface p-3 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60">
        <div className="mb-3 px-1.5 pt-1">
          <h2 className="text-[14px] font-black text-foreground">مرکز فعالیت</h2>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            پین را روی محل استقرار ادوات یا روستای خود قرار دهید.
          </p>
        </div>
        <MapPicker value={center} onChange={onCenterChange} />
      </section>

      <section className="rounded-[26px] bg-surface p-4 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-[14px] font-black text-foreground">
              <Radar className="size-4 text-primary" />
              شعاع پوشش خدمات
            </h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              پوشش تقریبی {new Intl.NumberFormat("fa-IR").format(coverageKm2)} کیلومتر مربع
            </p>
          </div>
          <p className="shrink-0 text-left">
            <span className="text-[28px] font-black leading-none tabular-nums text-primary">
              {toPersianDigits(radiusKm)}
            </span>
            <span className="ms-1 text-[11px] font-bold text-muted-foreground">کیلومتر</span>
          </p>
        </div>

        <Slider
          className="mt-5"
          min={MIN_RADIUS_KM}
          max={MAX_RADIUS_KM}
          step={5}
          value={[radiusKm]}
          onValueChange={(value) => onRadiusChange(value[0] ?? radiusKm)}
          aria-label="شعاع پوشش"
        />

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onRadiusChange(preset)}
              aria-pressed={radiusKm === preset}
              className={cn(
                "h-9 rounded-xl text-[12px] font-bold tabular-nums transition-colors",
                radiusKm === preset
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-foreground/75 hover:bg-muted",
              )}
            >
              {toPersianDigits(preset)}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={onSave}
        disabled={saving || (!dirty && configured)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-black text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)] transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
      >
        {saving ? <LoaderCircle className="size-5 animate-spin" /> : <Check className="size-5" />}
        {!dirty && configured ? "تغییری برای ذخیره نیست" : "ذخیره محدوده کاری"}
      </button>
    </div>
  );
}
