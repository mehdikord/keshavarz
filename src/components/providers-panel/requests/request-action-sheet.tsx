"use client";

import { useState } from "react";
import { Ban, Check, CircleCheck, LoaderCircle, PhoneCall, Lock, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type RequestAction = "accept" | "reject" | "cancel";

export interface RequestActionTarget {
  serviceName: string;
  landTitle: string;
  priceToman: number;
}

const MIN_CANCEL_REASON = 3;

const REASONS: Record<Exclude<RequestAction, "accept">, string[]> = {
  reject: [
    "در تاریخ درخواستی در دسترس نیستم",
    "فاصله زمین زیاد است",
    "ادوات مناسب این کار را ندارم",
    "حجم کار فعلی‌ام زیاد است",
  ],
  cancel: [
    "خرابی ادوات",
    "عدم دسترسی در تاریخ مقرر",
    "با کشاورز به توافق نرسیدیم",
    "شرایط نامناسب آب‌وهوا",
  ],
};

const COPY: Record<RequestAction, { title: string; description: string; confirm: string }> = {
  accept: {
    title: "قبول درخواست",
    description: "پس از قبول، این کار به شما سپرده می‌شود.",
    confirm: "قبول و شروع کار",
  },
  reject: {
    title: "رد درخواست",
    description: "در صورت تمایل دلیل رد را مشخص کنید.",
    confirm: "رد درخواست",
  },
  cancel: {
    title: "لغو کار",
    description: "کشاورز از لغو مطلع می‌شود. ثبت دلیل الزامی است.",
    confirm: "تأیید لغو",
  },
};

interface RequestActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: RequestAction;
  target: RequestActionTarget | null;
  /** Changes on every open so the form starts fresh. */
  formKey: number;
  onConfirm: (reason?: string) => Promise<boolean>;
}

export function RequestActionSheet({
  open,
  onOpenChange,
  action,
  target,
  formKey,
  onConfirm,
}: RequestActionSheetProps) {
  const copy = COPY[action];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[90dvh] max-w-[430px] flex-col gap-0 rounded-t-[30px] border-0 bg-background p-0"
      >
        <div className="shrink-0 px-5 pb-2 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-border" />
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl text-white",
                action === "accept"
                  ? "bg-gradient-to-br from-[#52b788] to-[#2d6a4f]"
                  : "bg-gradient-to-br from-[#f28b74] to-[#d1492b]",
              )}
            >
              {action === "accept" ? <Check className="size-5" strokeWidth={2.75} /> : <Ban className="size-5" />}
            </span>
            <div className="min-w-0 flex-1 text-right">
              <SheetTitle className="text-base font-black">{copy.title}</SheetTitle>
              <SheetDescription className="mt-0.5 text-[11.5px]">{copy.description}</SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="بستن"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <ActionForm key={formKey} action={action} target={target} onConfirm={onConfirm} />
      </SheetContent>
    </Sheet>
  );
}

function ActionForm({
  action,
  target,
  onConfirm,
}: Pick<RequestActionSheetProps, "action" | "target" | "onConfirm">) {
  const [chip, setChip] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  const reason = [chip, detail.trim()].filter(Boolean).join(" — ");
  const reasonMissing = action === "cancel" && reason.length < MIN_CANCEL_REASON;

  const handleConfirm = async () => {
    if (reasonMissing) {
      setShowError(true);
      return;
    }
    setSubmitting(true);
    const ok = await onConfirm(action === "accept" ? undefined : reason || undefined);
    if (!ok) setSubmitting(false);
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 pb-5 pt-3">
        {target ? (
          <div className="rounded-[20px] bg-surface p-4 ring-1 ring-border/60">
            <p className="text-[14px] font-black text-foreground">{target.serviceName}</p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{target.landTitle}</p>
            {target.priceToman > 0 ? (
              <p className="mt-2 text-[13px] font-black text-primary">
                {new Intl.NumberFormat("fa-IR").format(target.priceToman)} تومان
              </p>
            ) : null}
          </div>
        ) : null}

        {action === "accept" ? (
          <ul className="space-y-2.5">
            {[
              { icon: PhoneCall, text: "شماره تماس کشاورز برای هماهنگی به شما نمایش داده می‌شود." },
              { icon: Lock, text: "درخواست برای سایر خدمات‌دهندگان بسته می‌شود." },
              { icon: CircleCheck, text: "پس از انجام کار، کشاورز آن را تکمیل‌شده اعلام می‌کند." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#d8f3dc] text-[#2d6a4f]">
                    <Icon className="size-4" />
                  </span>
                  <span className="pt-1.5 text-[12.5px] leading-5 text-foreground/85">{item.text}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {REASONS[action].map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={chip === option}
                  onClick={() => setChip((current) => (current === option ? null : option))}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                    chip === option
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground/80 ring-1 ring-border/70 hover:bg-muted",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <Textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              maxLength={500}
              placeholder={action === "cancel" ? "توضیح بیشتر برای کشاورز" : "توضیح بیشتر (اختیاری)"}
              className="min-h-20 rounded-2xl bg-surface text-[13px] leading-6"
            />
            {showError && reasonMissing ? (
              <p className="text-[11.5px] font-medium text-destructive">یک دلیل انتخاب یا وارد کنید</p>
            ) : null}
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-black transition active:scale-[0.98] disabled:opacity-70",
            action === "accept"
              ? "bg-primary text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)]"
              : "bg-destructive text-white shadow-[0_14px_28px_-14px_rgba(209,73,43,0.8)]",
          )}
        >
          {submitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
          {COPY[action].confirm}
        </button>
      </div>
    </>
  );
}
