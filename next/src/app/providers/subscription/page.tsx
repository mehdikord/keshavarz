"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { isApiClientError } from "@/lib/api/envelope";
import {
  fetchAppPayments,
  type AppPaymentSummary,
} from "@/lib/api/app-payments";
import {
  fetchAppProviderSubscription,
  fetchAppProviderSubscriptions,
  fetchAppSubscriptionPlans,
  isAppSubscriptionActive,
  purchaseAppProviderSubscription,
  type AppActiveSubscription,
  type AppSubscriptionHistoryItem,
  type AppSubscriptionPlan,
} from "@/lib/api/app-subscriptions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";

function formatPersianDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function remainingDaysFromSeconds(seconds: number): number {
  return Math.max(0, Math.ceil(seconds / (60 * 60 * 24)));
}

function planFeatureList(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((item): item is string => typeof item === "string");
}

function subscriptionStatusLabel(status: string, active: boolean): string {
  if (active) return "فعال";
  if (status === "pending_payment") return "در انتظار پرداخت";
  if (status === "cancelled") return "لغو شده";
  if (status === "expired") return "منقضی";
  return "غیرفعال";
}

function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "پرداخت‌شده";
    case "pending":
    case "initiated":
      return "در انتظار";
    case "failed":
      return "ناموفق";
    default:
      return status;
  }
}

/* ------------------------------------------------------------------ */
/*  SVG ring progress (app-style)                                      */
/* ------------------------------------------------------------------ */
function ProgressRing({
  percent,
  size = 80,
  stroke = 6,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/60"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#ring-gradient)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--success)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function ProviderSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [plans, setPlans] = useState<AppSubscriptionPlan[]>([]);
  const [subscription, setSubscription] =
    useState<AppActiveSubscription | null>(null);
  const [history, setHistory] = useState<AppSubscriptionHistoryItem[]>([]);
  const [payments, setPayments] = useState<AppPaymentSummary[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(null);
  const [purchasing, startPurchase] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const [planList, current, historyResult, paymentsResult] =
          await Promise.all([
            fetchAppSubscriptionPlans(controller.signal),
            fetchAppProviderSubscription(controller.signal).catch(
              (cause: unknown) => {
                if (isApiClientError(cause) && cause.status === 404) {
                  setNeedsProfile(true);
                  return null;
                }
                throw cause;
              },
            ),
            fetchAppProviderSubscriptions({
              limit: 20,
              signal: controller.signal,
            }).catch((cause: unknown) => {
              if (isApiClientError(cause) && cause.status === 404) {
                return { items: [] as AppSubscriptionHistoryItem[] };
              }
              throw cause;
            }),
            fetchAppPayments({ limit: 20, signal: controller.signal }),
          ]);

        if (controller.signal.aborted) return;

        setPlans(
          [...planList].sort((a, b) => a.sortOrder - b.sortOrder),
        );
        setSubscription(current);
        setHistory(historyResult.items);
        setPayments(paymentsResult.items);
        setError(null);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setError(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری اشتراک ناموفق بود",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const isActive = isAppSubscriptionActive(subscription);
  const remainingDays = subscription
    ? remainingDaysFromSeconds(subscription.remainingSeconds)
    : 0;
  const totalSpanDays =
    subscription?.startsAt && subscription.endsAt
      ? Math.max(
          1,
          Math.ceil(
            (new Date(subscription.endsAt).getTime() -
              new Date(subscription.startsAt).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 1;
  const progress = subscription
    ? Math.min(100, Math.round((remainingDays / totalSpanDays) * 100))
    : 0;

  const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode);

  const handlePurchase = () => {
    if (!selectedPlanCode) return;

    startPurchase(async () => {
      try {
        const result = await purchaseAppProviderSubscription({
          planCode: selectedPlanCode,
        });
        setSelectedPlanCode(null);
        toast.success("در حال تأیید پرداخت…");
        router.push(
          `/providers/subscription/return?paymentId=${encodeURIComponent(result.paymentId)}`,
        );
      } catch (cause: unknown) {
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "شروع خرید اشتراک ناموفق بود",
        );
      }
    });
  };

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="اشتراک‌ها"
          description="مدیریت اشتراک و دسترسی به جستجو"
        />
        <div className="flex justify-center py-16">
          <div className="size-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="اشتراک‌ها"
          description="مدیریت اشتراک و دسترسی به جستجو"
        />
        <EmptyState
          icon={AlertTriangle}
          title="خطا در بارگذاری"
          description={error}
        />
      </PageContainer>
    );
  }

  if (needsProfile) {
    return (
      <PageContainer withDock>
        <PageHeader
          title="اشتراک‌ها"
          description="مدیریت اشتراک و دسترسی به جستجو"
        />
        <EmptyState
          icon={Wrench}
          title="پروفایل خدمات‌دهنده تکمیل نشده"
          description="قبل از خرید اشتراک، ابتدا خدمات و محدوده کاری را تنظیم کنید."
          action={{
            label: "تنظیم خدمات",
            href: "/providers/services",
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="اشتراک‌ها"
        description="مدیریت اشتراک و دسترسی به جستجو"
      />

      {/* ── Hero: Current Subscription ───────────────────────────── */}
      {subscription ? (
        <div className="mb-6 animate-fade-in">
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl border p-5 sm:p-6",
              isActive
                ? "border-primary/20 bg-gradient-to-br from-primary/[0.06] via-surface to-success/[0.06]"
                : "border-border/60 bg-surface",
            )}
          >
            {/* Decorative glow */}
            {isActive && (
              <div className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-primary/8 blur-3xl" />
            )}

            {/* Top row: status + remaining days */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl",
                    isActive
                      ? "bg-gradient-to-br from-primary to-success text-white shadow-md shadow-primary/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CreditCard className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    اشتراک فعال
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-tight">
                    {subscription.planName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Badge
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700",
                  )}
                >
                  {subscriptionStatusLabel(subscription.status, isActive)}
                </Badge>
              </div>
            </div>

            {/* Progress ring + dates */}
            <div className="relative mt-5 flex items-center gap-5">
              <div className="relative flex shrink-0 items-center justify-center">
                <ProgressRing percent={progress} size={88} stroke={7} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold leading-none">
                    {toPersianDigits(remainingDays)}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    روز
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {formatPersianDate(subscription.startsAt)}
                  </span>
                  <span className="text-muted-foreground/50">—</span>
                  <span className="truncate">
                    {formatPersianDate(subscription.endsAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  <span>
                    {toPersianDigits(remainingDays)} روز از{" "}
                    {toPersianDigits(totalSpanDays)} روز باقی‌مانده
                  </span>
                </div>
                {/* Linear progress */}
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-primary to-success transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-border/60 bg-surface/50 p-5 text-center sm:p-6">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
              <CreditCard className="size-7" />
            </div>
            <p className="text-sm font-medium text-foreground">
              هیچ اشتراکی فعال نیست
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              برای دیده شدن در جستجوی خدمات‌گیرندگان، یک پلن انتخاب کنید.
            </p>
          </div>
        </div>
      )}

      {/* ── Purchase Plans ───────────────────────────────────────── */}
      <section className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">خرید اشتراک</h2>
        </div>

        {plans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="پلنی موجود نیست"
            description="در حال حاضر پلن فعالی برای خرید وجود ندارد."
          />
        ) : (
          <div className="grid gap-4">
            {plans.map((plan) => {
              const features = planFeatureList(plan.features);
              return (
                <div
                  key={plan.planId}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border-2 transition-all duration-200",
                    plan.isRecommended
                      ? "border-primary/30 bg-gradient-to-br from-primary/[0.05] via-surface to-success/[0.04] shadow-md shadow-primary/8"
                      : "border-border/50 bg-surface hover:border-border/80 hover:shadow-sm",
                  )}
                >
                  {/* Recommended ribbon */}
                  {plan.isRecommended && (
                    <div className="absolute left-0 top-0">
                      <div className="flex items-center gap-1 rounded-br-xl rounded-tl-2xl bg-gradient-to-l from-primary to-success px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
                        <Sparkles className="size-3" />
                        پیشنهادی
                      </div>
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    {/* Header: icon + title + duration */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-12 items-center justify-center rounded-2xl",
                          plan.isRecommended
                            ? "bg-gradient-to-br from-primary to-success text-white shadow-md shadow-primary/20"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <CreditCard className="size-6" />
                      </div>
                      <div>
                        <p className="text-base font-bold">{plan.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {toPersianDigits(plan.durationMonths)} ماه دسترسی
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {plan.description && (
                      <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
                        {plan.description}
                      </p>
                    )}

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2">
                        {features.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                          >
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                              <CheckCircle2 className="size-3 text-success" />
                            </div>
                            <span className="text-foreground/80">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Price — its own row */}
                    <div className="mt-5 flex items-baseline justify-center gap-1.5" dir="ltr">
                      <span className="text-xl font-extrabold tracking-tight text-primary">
                        {plan.priceToman.toLocaleString("fa-IR")}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        تومان
                      </span>
                    </div>

                    {/* Separator */}
                    <div className="my-4 h-px bg-border/50" />

                    {/* Full-width buy button */}
                    <Button
                      type="button"
                      className={cn(
                        "h-12 w-full rounded-2xl text-sm font-bold",
                        plan.isRecommended
                          ? "shadow-md shadow-primary/20"
                          : "",
                      )}
                      variant={plan.isRecommended ? "default" : "outline"}
                      disabled={purchasing}
                      onClick={() => setSelectedPlanCode(plan.code)}
                    >
                      <CreditCard className="size-4" />
                      خرید پلن {plan.name}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── History ──────────────────────────────────────────────── */}
      {(history.length > 0 || payments.length > 0) && (
        <section className="mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">تاریخچه</h2>
          </div>

          {/* Subscription history */}
          {history.length > 0 && (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.subscriptionId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-surface/80 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
                      <CreditCard className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{record.planName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPersianDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={
                        record.status === "active"
                          ? "success"
                          : record.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {subscriptionStatusLabel(
                        record.status,
                        record.status === "active",
                      )}
                    </Badge>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(record.amountToman)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && payments.length > 0 && (
            <Separator className="opacity-50" />
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-surface/80 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-xl",
                        payment.status === "paid"
                          ? "bg-success/10 text-success"
                          : payment.status === "failed"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-accent/10 text-accent",
                      )}
                    >
                      {payment.status === "paid" ? (
                        <CheckCircle2 className="size-4.5" />
                      ) : (
                        <Clock className="size-4.5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {paymentStatusLabel(payment.status)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPersianDate(
                          payment.paidAt ?? payment.createdAt,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {payment.status === "pending" ||
                    payment.status === "initiated" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg px-2.5 text-[10px]"
                        onClick={() =>
                          router.push(
                            `/providers/subscription/return?paymentId=${encodeURIComponent(payment.paymentId)}`,
                          )
                        }
                      >
                        تأیید
                      </Button>
                    ) : null}
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(payment.amountToman)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        open={selectedPlanCode !== null}
        onOpenChange={(open) =>
          !open && !purchasing && setSelectedPlanCode(null)
        }
        title="تأیید خرید اشتراک"
        description={
          selectedPlan
            ? `پرداخت ${formatPrice(selectedPlan.priceToman)} برای «${selectedPlan.name}» آغاز می‌شود و پس از تأیید درگاه، اشتراک فعال خواهد شد.`
            : "پرداخت از طریق درگاه انجام و سپس تأیید می‌شود."
        }
        confirmLabel={purchasing ? "در حال انتقال…" : "ادامه پرداخت"}
        loading={purchasing}
        onConfirm={handlePurchase}
      />
    </PageContainer>
  );
}
