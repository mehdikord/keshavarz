"use client";

import { Check, Sparkles } from "lucide-react";

import type { AppSubscriptionPlan } from "@/lib/api/app-subscriptions";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

export function planFeatureList(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((item): item is string => typeof item === "string");
}

function durationLabel(months: number) {
  if (months === 12) return "یک‌ساله";
  if (months === 1) return "یک‌ماهه";
  return `${toPersianDigits(months)} ماهه`;
}

interface PlanCardProps {
  plan: AppSubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const features = planFeatureList(plan.features);
  const perMonth = plan.durationMonths > 1 ? Math.round(plan.priceToman / plan.durationMonths) : null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative block w-full overflow-hidden rounded-[26px] p-5 text-right transition-all duration-300",
        selected
          ? "bg-surface shadow-[0_22px_44px_-24px_rgba(45,106,79,0.75)] ring-2 ring-primary"
          : "bg-surface/80 shadow-[0_14px_30px_-24px_rgba(45,106,79,0.5)] ring-1 ring-border/70 hover:ring-primary/30",
      )}
    >
      {plan.isRecommended ? (
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-[#ffd27f]/30 blur-2xl" />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[16px] font-black text-foreground">{plan.name}</h3>
            {plan.isRecommended ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-[#f9b46b] to-[#e8892c] px-2 py-0.5 text-[10px] font-black text-white">
                <Sparkles className="size-3" />
                پیشنهاد ما
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
            {durationLabel(plan.durationMonths)}
          </p>
        </div>
        <span
          aria-hidden
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full transition-all",
            selected ? "bg-primary text-primary-foreground" : "ring-2 ring-border",
          )}
        >
          {selected ? <Check className="size-4" strokeWidth={3} /> : null}
        </span>
      </div>

      <p className="relative mt-4 flex items-baseline gap-1.5">
        <span className="text-[30px] font-black leading-none tabular-nums text-foreground">
          {new Intl.NumberFormat("fa-IR").format(plan.priceToman)}
        </span>
        <span className="text-[12px] font-bold text-muted-foreground">تومان</span>
      </p>
      {perMonth ? (
        <p className="relative mt-1 text-[11px] font-bold text-primary">
          ماهی {new Intl.NumberFormat("fa-IR").format(perMonth)} تومان
        </p>
      ) : null}

      {plan.description ? (
        <p className="relative mt-3 text-[12px] leading-6 text-muted-foreground">{plan.description}</p>
      ) : null}

      {features.length > 0 ? (
        <ul className="relative mt-4 space-y-2 border-t border-dashed border-border pt-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5 text-[12.5px] text-foreground/85">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#d8f3dc] text-[#2d6a4f]">
                <Check className="size-3" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
    </button>
  );
}
