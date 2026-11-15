"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";

import { SatelliteThumb } from "@/components/shared/satellite-thumb";
import { cn } from "@/lib/utils";
import { formatAreaSqm } from "@/lib/utils/format";
import type { Land } from "@/types";

interface LandPickerProps {
  lands: Land[];
  value: string;
  onChange: (landId: string) => void;
}

export function LandPicker({ lands, value, onChange }: LandPickerProps) {
  return (
    <div className="space-y-2">
      <div role="radiogroup" aria-label="انتخاب زمین" className="space-y-2">
        {lands.map((land) => {
          const selected = land.id === value;
          const area = formatAreaSqm(land.areaSqm);
          return (
            <button
              key={land.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(land.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl p-2 pe-3 text-right transition-all active:scale-[0.99]",
                selected
                  ? "bg-[#fff6ea] ring-2 ring-[#b9531f]"
                  : "bg-[#fffcf7] ring-1 ring-[#efe0c8] hover:ring-[#e3b97f]",
              )}
            >
              <SatelliteThumb
                lat={land.location.lat}
                lng={land.location.lng}
                zoom={15}
                className="size-11 shrink-0 rounded-xl"
                fallback={<div className="absolute inset-0 bg-gradient-to-br from-[#efe0c0] to-[#d6b884]" />}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black text-[#3b2410]">{land.title}</span>
                <span className="mt-0.5 block text-[11px] text-[#8a6a48]">
                  {area.primary} {area.primaryUnit}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
                  selected ? "bg-[#b9531f] text-white" : "ring-[1.5px] ring-inset ring-[#d9c3a2]",
                )}
              >
                {selected ? <Check className="size-3" strokeWidth={3.5} /> : null}
              </span>
            </button>
          );
        })}
      </div>
      <Link
        href="/users/lands/new"
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#e3c9a3] py-2.5 text-[12px] font-bold text-[#b9531f] transition-colors hover:bg-[#fff8ec]"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        افزودن زمین جدید
      </Link>
    </div>
  );
}
