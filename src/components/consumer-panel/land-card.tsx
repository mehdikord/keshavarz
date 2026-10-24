"use client";

import Link from "next/link";
import { useState } from "react";
import { Expand, MapPin, Pencil, Search, Trash2 } from "lucide-react";

import { ParsimapMap } from "@/components/shared/parsimap-map";
import { SatelliteThumb } from "@/components/shared/satellite-thumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAreaSqm } from "@/lib/utils/format";
import type { Land } from "@/types";

const ADDED = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long", day: "numeric" });

interface LandCardProps {
  land: Land;
  onDelete: (land: Land) => void;
}

function FieldFallback() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(150deg,#e9dcc0_0%,#d9c08f_55%,#c7a66b_100%)]">
      <svg aria-hidden viewBox="0 0 200 120" preserveAspectRatio="none" className="size-full" fill="none">
        {Array.from({ length: 9 }, (_, row) => (
          <path
            key={row}
            d={`M-10 ${row * 16} C 60 ${row * 16 - 10}, 130 ${row * 16 + 14}, 210 ${row * 16}`}
            className="stroke-[#7a5320]"
            strokeOpacity="0.18"
            strokeWidth="3"
          />
        ))}
      </svg>
    </div>
  );
}

export function LandCard({ land, onDelete }: LandCardProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const area = formatAreaSqm(land.areaSqm);

  return (
    <>
      <article className="overflow-hidden rounded-[26px] bg-white shadow-[0_18px_36px_-24px_rgba(160,86,26,0.55)] ring-1 ring-[#efe0c8]">
        <button
          type="button"
          onClick={() => setMapOpen(true)}
          aria-label={`نمایش ${land.title} روی نقشه`}
          className="group relative block h-40 w-full text-right"
        >
          <SatelliteThumb
            lat={land.location.lat}
            lng={land.location.lng}
            className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
            fallback={<FieldFallback />}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,transparent_35%,transparent_55%,rgba(30,18,6,0.65)_100%)]" />

          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <span className="parsimap-pin block scale-75" />
          </span>

          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-black text-[#3b2410] shadow-sm backdrop-blur">
            {area.primary} {area.primaryUnit}
          </span>
          <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition group-hover:bg-black/50">
            <Expand className="size-4" />
          </span>

          <span className="absolute inset-x-4 bottom-3 text-white">
            <span className="block truncate text-[17px] font-black drop-shadow">{land.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-white/80">
              <MapPin className="size-3" />
              <span dir="ltr" className="tabular-nums">
                {land.location.lat.toFixed(4)}, {land.location.lng.toFixed(4)}
              </span>
            </span>
          </span>
        </button>

        <div className="p-4">
          {land.description ? (
            <p className="line-clamp-2 text-[12px] leading-6 text-[#6b4a26]">{land.description}</p>
          ) : (
            <p className="text-[11.5px] text-[#a08463]">ثبت‌شده در {ADDED.format(new Date(land.createdAt))}</p>
          )}

          <div className="mt-3.5 flex items-center gap-2">
            <Link
              href={`/users/search?landId=${encodeURIComponent(land.id)}`}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#b9531f] text-[13px] font-black text-white shadow-[0_12px_24px_-14px_rgba(185,83,31,0.9)] transition active:scale-[0.98]"
            >
              <Search className="size-4" />
              درخواست خدمت
            </Link>
            <Link
              href={`/users/lands/${land.id}/edit`}
              aria-label={`ویرایش ${land.title}`}
              className="flex size-11 items-center justify-center rounded-2xl bg-[#fdebd3] text-[#a0561a] transition-colors hover:bg-[#fbdfba]"
            >
              <Pencil className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => onDelete(land)}
              aria-label={`حذف ${land.title}`}
              className="flex size-11 items-center justify-center rounded-2xl bg-[#fde2dc]/70 text-[#b23a1f] transition-colors hover:bg-[#fde2dc]"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </article>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="gap-3 rounded-[26px] p-4 sm:max-w-lg">
          <DialogHeader className="gap-1 text-right">
            <DialogTitle className="text-base font-black">{land.title}</DialogTitle>
            <DialogDescription>
              {area.primary} {area.primaryUnit}
              {area.secondary ? ` (${area.secondary})` : ""}
            </DialogDescription>
          </DialogHeader>
          {mapOpen ? (
            <ParsimapMap
              center={land.location}
              value={land.location}
              interactive={false}
              className="h-72 rounded-2xl border border-border/70"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
