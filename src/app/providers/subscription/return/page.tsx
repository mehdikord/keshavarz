"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  fetchAppPayment,
  verifyAppPayment,
  type AppPaymentDetail,
} from "@/lib/api/app-payments";
import { isApiClientError } from "@/lib/api/envelope";
import { formatPrice } from "@/lib/utils/format";

type VerifyState =
  | { kind: "loading" }
  | { kind: "success"; payment: AppPaymentDetail }
  | { kind: "error"; message: string; payment?: AppPaymentDetail };

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

  if (!paymentId) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="نتیجه پرداخت"
          description="تأیید وضعیت پرداخت اشتراک"
        />
        <Card className="border-border/70">
          <CardContent className="space-y-4 py-10 text-center">
            <CircleAlert className="mx-auto size-10 text-amber-600" />
            <p className="font-semibold">شناسه پرداخت یافت نشد</p>
            <p className="text-sm text-muted-foreground">
              از صفحه اشتراک دوباره اقدام کنید.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/providers/subscription">بازگشت به اشتراک</Link>
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="نتیجه پرداخت"
        description="تأیید وضعیت پرداخت اشتراک"
      />

      {state.kind === "loading" ? (
        <Card className="border-border/70">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <LoaderCircle className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              در حال تأیید پرداخت…
            </p>
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "success" ? (
        <Card className="border-emerald-200/80 bg-emerald-50/40">
          <CardContent className="space-y-4 p-5 text-center">
            <CheckCircle2 className="mx-auto size-10 text-emerald-700" />
            <div>
              <p className="text-lg font-bold text-emerald-900">
                پرداخت تأیید شد
              </p>
              <p className="mt-1 text-sm text-emerald-800/80">
                اشتراک شما طبق وضعیت سرور فعال می‌شود.
              </p>
            </div>
            <div className="rounded-xl bg-white/70 px-4 py-3 text-sm">
              <p>مبلغ: {formatPrice(state.payment.amountToman)}</p>
              {state.payment.subscriptionStatus ? (
                <p className="mt-1 text-muted-foreground">
                  وضعیت اشتراک: {state.payment.subscriptionStatus}
                </p>
              ) : null}
            </div>
            <Button asChild className="h-11 w-full rounded-xl">
              <Link href="/providers/subscription">مشاهده اشتراک</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.kind === "error" ? (
        <Card className="border-rose-200/80 bg-rose-50/40">
          <CardContent className="space-y-4 p-5 text-center">
            <CircleAlert className="mx-auto size-10 text-rose-700" />
            <div>
              <p className="text-lg font-bold text-rose-900">پرداخت تأیید نشد</p>
              <p className="mt-1 text-sm text-rose-800/80">{state.message}</p>
            </div>
            {state.payment?.failureMessage ? (
              <p className="rounded-xl bg-white/70 px-4 py-3 text-sm text-muted-foreground">
                {state.payment.failureMessage}
              </p>
            ) : null}
            <div className="grid gap-2">
              <Button asChild className="h-11 rounded-xl">
                <Link href="/providers/subscription">بازگشت به اشتراک</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => {
                  setState({ kind: "loading" });
                  setAttempt((value) => value + 1);
                }}
              >
                تلاش مجدد تأیید
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}

export default function ProviderSubscriptionReturnPage() {
  return (
    <Suspense
      fallback={
        <PageContainer withDock>
          <PageHeader title="نتیجه پرداخت" />
          <LoadingSpinner className="py-16" />
        </PageContainer>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
