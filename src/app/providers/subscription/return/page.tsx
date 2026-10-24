"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, CircleAlert, LoaderCircle, RotateCw, X } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import {
  fetchAppPayment,
  verifyAppPayment,
  type AppPaymentDetail,
} from "@/lib/api/app-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { subscriptionStatusInfo } from "@/lib/subscriptions/labels";
import { cn } from "@/lib/utils";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; payment: AppPaymentDetail }
  | { kind: "error"; message: string; payment?: AppPaymentDetail };

const DATE = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer withDock className="px-0 pt-0">
      <ProviderPageHero title="نتیجه پرداخت" backHref="/providers/subscription" />
      <div className="relative z-10 -mt-4 px-4">{children}</div>
    </PageContainer>
  );
}

function ResultBadge({ tone }: { tone: "success" | "error" | "loading" }) {
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={cn(
        "relative mx-auto flex size-20 items-center justify-center rounded-full text-white",
        tone === "success" && "bg-gradient-to-br from-[#52b788] to-[#2d6a4f] shadow-[0_18px_36px_-14px_rgba(45,106,79,0.9)]",
        tone === "error" && "bg-gradient-to-br from-[#f28b74] to-[#d1492b] shadow-[0_18px_36px_-14px_rgba(209,73,43,0.8)]",
        tone === "loading" && "bg-primary/10 text-primary",
      )}
    >
      {tone === "success" ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-[#52b788]/30 [animation-iteration-count:2]" />
          <Check className="relative size-10" strokeWidth={3} />
        </>
      ) : tone === "error" ? (
        <X className="size-10" strokeWidth={3} />
      ) : (
        <LoaderCircle className="size-10 animate-spin" />
      )}
    </motion.span>
  );
}

function PaymentDetails({ payment }: { payment: AppPaymentDetail }) {
  const rows = [
    { label: "مبلغ", value: `${new Intl.NumberFormat("fa-IR").format(payment.amountToman)} تومان` },
    payment.paidAt ? { label: "زمان پرداخت", value: DATE.format(new Date(payment.paidAt)) } : null,
    payment.transactionReference ? { label: "کد پیگیری", value: payment.transactionReference, ltr: true } : null,
    payment.subscriptionStatus
      ? { label: "وضعیت اشتراک", value: subscriptionStatusInfo(payment.subscriptionStatus).label }
      : null,
  ].filter((row): row is { label: string; value: string; ltr?: boolean } => row !== null);

  return (
    <dl className="mt-5 divide-y divide-border/60 rounded-[20px] bg-background px-4 text-right ring-1 ring-border/60">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-3 py-3">
          <dt className="text-[12px] text-muted-foreground">{row.label}</dt>
          <dd dir={row.ltr ? "ltr" : undefined} className="truncate text-[13px] font-black tabular-nums text-foreground">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId")?.trim() ?? "";
  const [state, setState] = useState<VerifyState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!paymentId) return;

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const existing = await fetchAppPayment(paymentId, controller.signal);
        if (cancelled) return;

        if (existing.status === "paid") {
          setState({ kind: "success", payment: existing });
          return;
        }

        const verified = await verifyAppPayment(paymentId);
        if (cancelled) return;
        setState({ kind: "success", payment: verified });
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;

        let payment: AppPaymentDetail | undefined;
        try {
          payment = await fetchAppPayment(paymentId);
        } catch {
          // ignore secondary fetch
        }

        setState({
          kind: "error",
          message: isApiClientError(cause)
            ? cause.message
            : "تأیید پرداخت ناموفق بود. در صورت کسر وجه، وضعیت را از صفحه اشتراک بررسی کنید.",
          payment,
        });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [paymentId, attempt]);

  const card = "rounded-[28px] bg-surface px-5 py-8 text-center shadow-[0_18px_40px_-24px_rgba(45,106,79,0.5)] ring-1 ring-border/60";

  if (!paymentId) {
    return (
      <ResultShell>
        <div className={card}>
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#fdefd6] text-[#b4661a]">
            <CircleAlert className="size-8" />
          </span>
          <h2 className="mt-4 text-[17px] font-black">شناسه پرداخت یافت نشد</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">از صفحه اشتراک دوباره اقدام کنید.</p>
          <Link
            href="/providers/subscription"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-[14px] font-black text-primary-foreground"
          >
            بازگشت به اشتراک
          </Link>
        </div>
      </ResultShell>
    );
  }

  return (
    <ResultShell>
      <div className={card}>
        {state.kind === "loading" ? (
          <>
            <ResultBadge tone="loading" />
            <h2 className="mt-5 text-[17px] font-black">در حال تأیید پرداخت…</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">لطفاً چند لحظه صبر کنید و صفحه را نبندید.</p>
          </>
        ) : state.kind === "success" ? (
          <>
            <ResultBadge tone="success" />
            <h2 className="mt-5 text-[19px] font-black text-[#1b4332]">پرداخت با موفقیت انجام شد</h2>
            <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
              {state.payment.subscriptionStatus === "active"
                ? "اشتراک شما فعال شد. اگر خدمات و محدوده کاری را تکمیل کرده باشید، در جستجوی کشاورزان نمایش داده می‌شوید."
                : "پرداخت ثبت شد و اشتراک پس از تأیید نهایی فعال می‌شود."}
            </p>
            <PaymentDetails payment={state.payment} />
            <div className="mt-6 grid gap-2">
              <Link
                href="/providers/home"
                className="flex h-12 items-center justify-center rounded-2xl bg-primary text-[14px] font-black text-primary-foreground shadow-[0_14px_28px_-14px_rgba(45,106,79,0.9)]"
              >
                رفتن به داشبورد
              </Link>
              <Link
                href="/providers/subscription"
                className="flex h-12 items-center justify-center rounded-2xl bg-primary/10 text-[13px] font-bold text-primary"
              >
                مشاهده اشتراک
              </Link>
            </div>
          </>
        ) : (
          <>
            <ResultBadge tone="error" />
            <h2 className="mt-5 text-[19px] font-black text-[#8a2a15]">پرداخت تأیید نشد</h2>
            <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{state.message}</p>
            {state.payment?.failureMessage ? (
              <p className="mt-4 rounded-[18px] bg-[#fde2dc]/60 px-4 py-3 text-[12px] leading-6 text-[#8a2a15]">
                {state.payment.failureMessage}
              </p>
            ) : null}
            {state.payment ? <PaymentDetails payment={state.payment} /> : null}
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setState({ kind: "loading" });
                  setAttempt((value) => value + 1);
                }}
                className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-primary text-[14px] font-black text-primary-foreground"
              >
                <RotateCw className="size-4" />
                تلاش مجدد تأیید
              </button>
              <Link
                href="/providers/subscription"
                className="flex h-12 items-center justify-center rounded-2xl bg-muted text-[13px] font-bold text-foreground/80"
              >
                بازگشت به اشتراک
              </Link>
            </div>
          </>
        )}
      </div>
    </ResultShell>
  );
}

export default function ProviderSubscriptionReturnPage() {
  return (
    <Suspense
      fallback={
        <ResultShell>
          <div className="h-72 animate-pulse rounded-[28px] bg-muted" />
        </ResultShell>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
