"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
        <LoadingSpinner className="py-16" />
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

      <Card className="card-elevated mb-5 overflow-hidden border-border/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">وضعیت اشتراک</p>
              <p className="text-lg font-bold">
                {subscription?.planName ?? "بدون اشتراک"}
              </p>
            </div>
            <Badge
              className={cn(
                isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              )}
            >
              {subscription
                ? subscriptionStatusLabel(subscription.status, isActive)
                : "منقضی"}
            </Badge>
          </div>

          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">شروع</p>
                  <p className="font-medium">
                    {formatPersianDate(subscription.startsAt)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">انقضا</p>
                  <p className="font-medium">
                    {formatPersianDate(subscription.endsAt)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{toPersianDigits(remainingDays)} روز باقی‌مانده</span>
                  <span>{toPersianDigits(progress)}٪</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-primary to-success transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              برای دیده شدن در جستجوی خدمات‌گیرندگان، یک پلن انتخاب کنید.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="mb-5 space-y-3">
        <h2 className="text-sm font-semibold">خرید اشتراک</h2>
        {plans.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="پلنی موجود نیست"
            description="در حال حاضر پلن فعالی برای خرید وجود ندارد."
          />
        ) : (
          plans.map((plan) => {
            const features = planFeatureList(plan.features);
            return (
              <Card
                key={plan.planId}
                className={cn(
                  "overflow-hidden border-border/70 transition-all",
                  plan.isRecommended && "border-primary/30 shadow-md",
                )}
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{plan.name}</p>
                        {plan.isRecommended ? (
                          <Badge className="bg-primary/10 text-primary">
                            <Sparkles className="size-3" />
                            پیشنهادی
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {toPersianDigits(plan.durationMonths)} ماه دسترسی
                      </p>
                      {plan.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(plan.priceToman)}
                    </p>
                  </div>

                  {features.length > 0 ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 shrink-0 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl"
                    variant={plan.isRecommended ? "default" : "outline"}
                    disabled={purchasing}
                    onClick={() => setSelectedPlanCode(plan.code)}
                  >
                    <CreditCard className="size-4" />
                    خرید {plan.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>

      {history.length > 0 ? (
        <section className="mb-5 space-y-3">
          <h2 className="text-sm font-semibold">تاریخچه اشتراک</h2>
          {history.map((record) => (
            <Card key={record.subscriptionId} className="border-border/70">
              <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{record.planName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPersianDate(record.createdAt)} ·{" "}
                    {subscriptionStatusLabel(
                      record.status,
                      record.status === "active",
                    )}
                  </p>
                </div>
                <p className="font-semibold text-primary">
                  {formatPrice(record.amountToman)}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      {payments.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">پرداخت‌های اخیر</h2>
          {payments.map((payment) => (
            <Card key={payment.paymentId} className="border-border/70">
              <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">
                    {paymentStatusLabel(payment.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPersianDate(payment.paidAt ?? payment.createdAt)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-primary">
                    {formatPrice(payment.amountToman)}
                  </p>
                  {payment.status === "pending" ||
                  payment.status === "initiated" ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() =>
                        router.push(
                          `/providers/subscription/return?paymentId=${encodeURIComponent(payment.paymentId)}`,
                        )
                      }
                    >
                      تأیید پرداخت
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}

      <ConfirmDialog
        open={selectedPlanCode !== null}
        onOpenChange={(open) => !open && !purchasing && setSelectedPlanCode(null)}
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
