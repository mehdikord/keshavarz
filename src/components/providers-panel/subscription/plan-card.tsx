"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Sparkles } from "lucide-react";

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

const formatToman = (value: number) => new Intl.NumberFormat("fa-IR").format(value);

interface PlanCardProps {
  plan: AppSubscriptionPlan;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, expanded, onSelect }: PlanCardProps) {
  const features = planFeatureList(plan.features);
  const perMonth = plan.durationMonths > 1 ? Math.round(plan.priceToman / plan.durationMonths) : null;
  const hasDetails = Boolean(plan.description) || features.length > 0;
  const detailsId = `plan-details-${plan.planId}`;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-controls={hasDetails ? detailsId : undefined}
      onClick={onSelect}
      className={cn(
        "relative block w-full overflow-hidden rounded-[22px] px-4 py-3.5 text-right transition-[box-shadow,background-color] duration-300",
        selected
          ? "bg-surface shadow-[0_18px_36px_-24px_rgba(45,106,79,0.75)] ring-2 ring-primary"
          : "bg-surface/80 shadow-[0_10px_24px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/70 hover:ring-primary/30",
      )}
    >
      {plan.isRecommended ? (
        <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-[#ffd27f]/30 blur-2xl" />
      ) : null}

      <div className="relative flex items-center gap-3">
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
            selected ? "bg-primary text-primary-foreground" : "ring-2 ring-border",
          )}
        >
          {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[14.5px] font-black text-foreground">{plan.name}</h3>
            {plan.isRecommended ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-[#f9b46b] to-[#e8892c] px-2 py-0.5 text-[10px] font-black text-white">
                <Sparkles className="size-3" />
                پیشنهاد ما
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {durationLabel(plan.durationMonths)}
          </p>
        </div>

        <div className="shrink-0 text-left">
          <p className="flex items-baseline justify-end gap-1">
            <span className="text-[19px] font-black leading-none tabular-nums text-foreground">
              {formatToman(plan.priceToman)}
            </span>
            <span className="text-[10.5px] font-bold text-muted-foreground">تومان</span>
          </p>
          {perMonth ? (
            <p className="mt-1 text-[10.5px] font-bold text-primary">ماهی {formatToman(perMonth)}</p>
          ) : null}
        </div>

        {hasDetails ? (
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {hasDetails && expanded ? (
          <motion.div
            id={detailsId}
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-dashed border-border pt-3">
              {plan.description ? (
                <p className="text-[12px] leading-6 text-muted-foreground">{plan.description}</p>
              ) : null}

              {features.length > 0 ? (
                <ul className="space-y-2">
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
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </button>
  );
}
