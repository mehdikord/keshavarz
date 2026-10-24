"use client";

import { CalendarPlus, CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { AppActiveSubscription, AppSubscriptionPlan } from "@/lib/api/app-subscriptions";
import { addMonths } from "@/lib/subscriptions/labels";
import { toPersianDigits } from "@/lib/utils/format";

const DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

interface CheckoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AppSubscriptionPlan | null;
  current: AppActiveSubscription | null;
  purchasing: boolean;
  onConfirm: () => void;
}

export function CheckoutSheet({
  open,
  onOpenChange,
  plan,
  current,
  purchasing,
  onConfirm,
}: CheckoutSheetProps) {
  // The server stacks a new purchase on top of the active period.
  const base = current?.endsAt ? new Date(current.endsAt) : new Date();
  const newEnd = plan ? addMonths(base, plan.durationMonths) : null;

  return (
    <Sheet open={open} onOpenChange={(next) => !purchasing && onOpenChange(next)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[90dvh] max-w-[430px] flex-col gap-0 rounded-t-[30px] border-0 bg-background p-0"
      >
        <div className="shrink-0 px-5 pb-2 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-border" />
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6d58e] to-[#c98a2b] text-[#3a2208]">
              <CreditCard className="size-5" />
            </span>
            <div className="min-w-0 flex-1 text-right">
              <SheetTitle className="text-base font-black">{current ? "تمدید اشتراک" : "خرید اشتراک"}</SheetTitle>
              <SheetDescription className="mt-0.5 text-[11.5px]">خلاصه سفارش را بررسی کنید</SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={purchasing}
              aria-label="بستن"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {plan ? (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 pt-3">
            <dl className="divide-y divide-border/60 rounded-[22px] bg-surface px-4 ring-1 ring-border/60">
              <div className="flex items-center justify-between py-3">
                <dt className="text-[12px] text-muted-foreground">طرح</dt>
                <dd className="text-[13px] font-black">{plan.name}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[12px] text-muted-foreground">مدت</dt>
                <dd className="text-[13px] font-bold">{toPersianDigits(plan.durationMonths)} ماه</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-[12px] text-muted-foreground">مبلغ قابل پرداخت</dt>
                <dd className="text-[17px] font-black text-primary">
                  {new Intl.NumberFormat("fa-IR").format(plan.priceToman)}
                  <span className="ms-1 text-[11px] font-bold text-muted-foreground">تومان</span>
                </dd>
              </div>
            </dl>

            {newEnd ? (
              <div className="flex items-start gap-3 rounded-[20px] bg-[#d8f3dc]/60 px-4 py-3">
                <CalendarPlus className="mt-0.5 size-5 shrink-0 text-[#2d6a4f]" />
                <p className="text-[12px] leading-6 text-[#1b4332]">
                  {current
                    ? "روزهای باقی‌مانده حفظ می‌شود و مدت جدید به انتهای اشتراک فعلی اضافه می‌شود. "
                    : "اشتراک بلافاصله پس از تأیید پرداخت فعال می‌شود. "}
                  اعتبار تا حدود <span className="font-black">{DATE.format(newEnd)}</span>
                </p>
              </div>
            ) : null}

            <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              پرداخت از طریق درگاه بانکی انجام و سپس تأیید می‌شود
            </p>
          </div>
        ) : null}

        <div className="shrink-0 border-t border-border/60 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <button
            type="button"
            onClick={onConfirm}
            disabled={purchasing || !plan}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-black text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)] transition active:scale-[0.98] disabled:opacity-70"
          >
            {purchasing ? <LoaderCircle className="size-5 animate-spin" /> : <CreditCard className="size-5" />}
            {purchasing ? "در حال انتقال به درگاه…" : "پرداخت و فعال‌سازی"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
