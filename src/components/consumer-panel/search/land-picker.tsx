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
    <div role="radiogroup" aria-label="انتخاب زمین" className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
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
              "relative w-40 shrink-0 snap-start overflow-hidden rounded-[20px] bg-white text-right transition-all",
              selected ? "ring-[3px] ring-[#b9531f]" : "ring-1 ring-[#efe0c8] hover:ring-[#e3b97f]",
            )}
          >
            <SatelliteThumb
              lat={land.location.lat}
              lng={land.location.lng}
              zoom={15}
              className="h-20 w-full"
              fallback={<div className="absolute inset-0 bg-gradient-to-br from-[#efe0c0] to-[#d6b884]" />}
            />
            {selected ? (
              <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-[#b9531f] text-white shadow-md">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : null}
            <span className="block px-3 py-2.5">
              <span className="block truncate text-[13px] font-black text-[#3b2410]">{land.title}</span>
              <span className="block text-[11px] text-[#8a6a48]">
                {area.primary} {area.primaryUnit}
              </span>
            </span>
          </button>
        );
      })}
      <Link
        href="/users/lands/new"
        className="flex w-28 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-[#e3c9a3] text-[12px] font-bold text-[#b9531f] transition-colors hover:bg-[#fff8ec]"
      >
        <Plus className="size-5" strokeWidth={2.5} />
        زمین جدید
      </Link>
    </div>
  );
}
