"use client";

import { useState } from "react";
import { Ban, LoaderCircle, X } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const REASONS = [
  "دیگر به این خدمت نیاز ندارم",
  "زمان انجام کار مناسب نیست",
  "خدمات‌دهنده دیگری پیدا کردم",
  "هزینه بالاتر از انتظار است",
];

/** Cancelling an accepted job requires a reason on the server (min 3 chars). */
const MIN_REASON = 3;
export const DEFAULT_CANCEL_REASON = "لغو توسط خدمات‌گیرنده";

interface CancelRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  /** In-progress jobs have an assigned provider, so a reason is mandatory. */
  reasonRequired: boolean;
  formKey: number;
  onConfirm: (reason: string) => Promise<boolean>;
}

export function CancelRequestSheet({
  open,
  onOpenChange,
  serviceName,
  reasonRequired,
  formKey,
  onConfirm,
}: CancelRequestSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="inset-x-0 mx-auto flex max-h-[90dvh] max-w-[430px] flex-col gap-0 rounded-t-[30px] border-0 bg-harvest-bg p-0"
      >
        <div className="shrink-0 px-5 pb-2 pt-3">
          <span aria-hidden className="mx-auto mb-3 block h-1.5 w-11 rounded-full bg-[#e8d6bb]" />
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f28b74] to-[#d1492b] text-white">
              <Ban className="size-5" />
            </span>
            <div className="min-w-0 flex-1 text-right">
              <SheetTitle className="text-base font-black text-[#3b2410]">لغو درخواست</SheetTitle>
              <SheetDescription className="mt-0.5 truncate text-[11.5px] text-[#8a6a48]">{serviceName}</SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="بستن"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f1e6d6] text-[#8a6a48] transition active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <CancelForm key={formKey} reasonRequired={reasonRequired} onConfirm={onConfirm} />
      </SheetContent>
    </Sheet>
  );
}

function CancelForm({
  reasonRequired,
  onConfirm,
}: Pick<CancelRequestSheetProps, "reasonRequired" | "onConfirm">) {
  const [chip, setChip] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  const reason = [chip, detail.trim()].filter(Boolean).join(" — ");
  const missing = reasonRequired && reason.length < MIN_REASON;

  const handleConfirm = async () => {
    if (missing) {
      setShowError(true);
      return;
    }
    setSubmitting(true);
    const ok = await onConfirm(reason || DEFAULT_CANCEL_REASON);
    if (!ok) setSubmitting(false);
  };

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5 pt-3">
        <p className="text-[12px] leading-6 text-[#6b4a26]">
          {reasonRequired
            ? "خدمات‌دهنده این کار را پذیرفته است؛ لطفاً دلیل لغو را مشخص کنید تا مطلع شود."
            : "درخواست برای همه خدمات‌دهندگان بسته می‌شود. دلیل لغو اختیاری است."}
        </p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={chip === option}
              onClick={() => setChip((current) => (current === option ? null : option))}
              className={cn(
                "rounded-full px-3.5 py-2 text-[12px] font-bold transition-colors",
                chip === option ? "bg-[#3b2410] text-[#fff3dc]" : "bg-white text-[#6b4a26] ring-1 ring-[#efe0c8] hover:bg-[#fff8ec]",
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
          placeholder="توضیح بیشتر (اختیاری)"
          className="min-h-20 rounded-2xl border-0 bg-white text-[13px] leading-6 ring-1 ring-[#efe0c8]"
        />
        {showError && missing ? (
          <p className="text-[11.5px] font-bold text-[#b23a1f]">یک دلیل انتخاب یا وارد کنید</p>
        ) : null}
      </div>
      <div className="shrink-0 border-t border-[#efe0c8] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c2402a] py-3.5 text-[14px] font-black text-white shadow-[0_14px_28px_-14px_rgba(194,64,42,0.9)] transition active:scale-[0.98] disabled:opacity-70"
        >
          {submitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
          تأیید لغو درخواست
        </button>
      </div>
    </>
  );
}
