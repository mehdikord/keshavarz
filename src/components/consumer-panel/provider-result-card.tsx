"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  Clock3,
  Navigation,
  Phone,
  Plus,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

import { pricingUnitLabel } from "@/lib/api/app-provider";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/format";

export type ProviderResultState = "idle" | "sent" | "rejected" | "accepted" | "removed";

export type ProviderHighlight = "nearest" | "cheapest";

const FULL = new Intl.NumberFormat("fa-IR");
const COMPACT = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

const HIGHLIGHTS: Record<ProviderHighlight, { label: string; icon: typeof Trophy; className: string }> = {
  nearest: { label: "نزدیک‌ترین", icon: Navigation, className: "bg-[#e1f0dc] text-[#2f6a35]" },
  cheapest: { label: "کمترین قیمت", icon: Trophy, className: "bg-[#fdebd3] text-[#9a4f12]" },
};

/** Land area lets us turn a per-unit price into a rough total for this farmer. */
export interface LandArea {
  squareMeters: number;
  label: string;
}

function estimateTotal(price: number, unit: string, area: LandArea | null): number | null {
  if (!area || area.squareMeters <= 0) return null;
  if (unit === "per_hectare") return Math.round((price * area.squareMeters) / 10_000);
  if (unit === "per_square_meter") return Math.round(price * area.squareMeters);
  return null;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0)).join("‌") || "؟";
}

interface ProviderResultCardProps {
  displayName: string;
  image?: string | null;
  distanceKm: number;
  price: number;
  pricingUnit?: string;
  state: ProviderResultState;
  profileHref: string;
  selected?: boolean;
  onToggleSelect?: () => void;
  highlights?: ProviderHighlight[];
  landArea?: LandArea | null;
  /** True when this provider declined one of the farmer's earlier requests. */
  declinedBefore?: boolean;
  /** Revealed once the provider accepts. */
  phone?: string | null;
}

export function ProviderResultCard({
  displayName,
  image,
  distanceKm,
  price,
  pricingUnit = "fixed",
  state,
  profileHref,
  selected = false,
  onToggleSelect,
  highlights = [],
  landArea = null,
  declinedBefore = false,
  phone,
}: ProviderResultCardProps) {
  if (state === "removed") return null;

  const estimate = estimateTotal(price, pricingUnit, landArea);
  const selectable = state === "idle" && Boolean(onToggleSelect);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[26px] bg-white transition-all duration-300",
        selected
          ? "shadow-[0_22px_40px_-22px_rgba(185,83,31,0.75)] ring-[2.5px] ring-[#b9531f]"
          : state === "accepted"
            ? "shadow-[0_22px_40px_-24px_rgba(47,106,53,0.6)] ring-2 ring-[#7fbf84]"
            : "shadow-[0_14px_30px_-22px_rgba(160,86,26,0.5)] ring-1 ring-[#efe0c8]",
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Link
            href={profileHref}
            aria-label={`مشاهده پروفایل ${displayName}`}
            className="relative shrink-0 rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-[#b9531f]"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="size-14 rounded-[18px] object-cover ring-2 ring-[#fdebd3]" />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#ffe2ad] to-[#e8954a] text-[17px] font-black text-[#5c3410]">
                {initialsOf(displayName)}
              </span>
            )}
            {state === "accepted" ? (
              <span className="absolute -bottom-1 -left-1 flex size-6 items-center justify-center rounded-full bg-[#4f9a55] text-white ring-2 ring-white">
                <BadgeCheck className="size-3.5" />
              </span>
            ) : null}
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={profileHref} className="block truncate text-[15.5px] font-black text-[#3b2410] hover:text-[#b9531f]">
              {displayName}
            </Link>
            {highlights.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {highlights.map((key) => {
                  const config = HIGHLIGHTS[key];
                  const Icon = config.icon;
                  return (
                    <span
                      key={key}
                      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black", config.className)}
                    >
                      <Icon className="size-3" />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            ) : (
              <Link href={profileHref} className="mt-0.5 inline-flex items-center text-[11px] font-bold text-[#a08463]">
                مشاهده پروفایل و نمونه‌کارها
                <ChevronLeft className="size-3.5" />
              </Link>
            )}
          </div>

          <Link
            href={profileHref}
            aria-hidden
            tabIndex={-1}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fcf7ee] text-[#a08463] transition-colors hover:bg-[#fff1df]"
          >
            <ChevronLeft className="size-4" />
          </Link>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#fcf7ee] px-3 py-2.5">
            <p className="flex items-center gap-1 text-[10.5px] font-bold text-[#a08463]">
              <Navigation className="size-3" />
              فاصله تا زمین شما
            </p>
            <p className="mt-1 text-[15px] font-black tabular-nums text-[#3b2410]">{formatDistance(distanceKm)}</p>
          </div>
          <div className="rounded-2xl bg-[#fcf7ee] px-3 py-2.5">
            <p className="text-[10.5px] font-bold text-[#a08463]">قیمت · {pricingUnitLabel(pricingUnit)}</p>
            <p className="mt-1 text-[15px] font-black tabular-nums text-[#3b2410]">
              {FULL.format(price)}
              <span className="ms-1 text-[10px] font-bold text-[#a08463]">تومان</span>
            </p>
          </div>
        </div>

        {estimate !== null && landArea ? (
          <p className="mt-2 flex items-center gap-1.5 rounded-2xl bg-gradient-to-l from-[#fff1df] to-[#fffaf2] px-3 py-2 text-[11.5px] text-[#6b4a26]">
            <Sparkles className="size-3.5 shrink-0 text-[#e08a2b]" />
            <span className="min-w-0">
              برآورد برای زمین شما ({landArea.label}):{" "}
              <span className="font-black text-[#8a4512]">حدود {COMPACT.format(estimate)} تومان</span>
            </span>
          </p>
        ) : null}

        {declinedBefore && state === "idle" ? (
          <p className="mt-2 text-[11px] text-[#a08463]">این خدمات‌دهنده قبلاً یکی از درخواست‌های شما را نپذیرفته است.</p>
        ) : null}
      </div>

      <div className="border-t border-[#f1e6d6] px-4 py-3">
          {selectable ? (
            <button
              type="button"
              onClick={onToggleSelect}
              aria-pressed={selected}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-[13px] font-black transition active:scale-[0.98]",
                selected
                  ? "bg-[#b9531f] text-white"
                  : "bg-[#fff1df] text-[#a0561a] ring-1 ring-[#f3d3a8] hover:bg-[#ffe8c9]",
              )}
            >
              {selected ? <Check className="size-4" strokeWidth={3} /> : <Plus className="size-4" strokeWidth={2.5} />}
              {selected ? "انتخاب شد" : "انتخاب برای ارسال درخواست"}
            </button>
          ) : state === "sent" ? (
            <p role="status" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#fdebd3] text-[13px] font-black text-[#9a4f12]">
              <Clock3 className="size-4" />
              درخواست ارسال شد · منتظر پاسخ
            </p>
          ) : state === "rejected" ? (
            <p role="status" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#fde2dc] text-[13px] font-black text-[#b23a1f]">
              <XCircle className="size-4" />
              این درخواست را نپذیرفت
            </p>
          ) : state === "accepted" ? (
            <div className="flex items-center gap-2">
              <p role="status" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#e1f0dc] text-[13px] font-black text-[#2f6a35]">
                <BadgeCheck className="size-4" />
                کار را پذیرفت
              </p>
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex h-11 items-center gap-1.5 rounded-2xl bg-[#4f9a55] px-4 text-[13px] font-black text-white"
                >
                  <Phone className="size-4" />
                  تماس
                </a>
              ) : null}
            </div>
          ) : null}
      </div>

    </article>
  );
}
