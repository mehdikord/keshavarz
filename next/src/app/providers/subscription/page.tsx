"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/mock/subscriptions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { formatPrice, toPersianDigits } from "@/lib/utils/format";
import {
  hasActiveSubscription,
  useProviderStore,
} from "@/stores/provider-store";

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getRemainingDays(endDate: string): number {
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function ProviderSubscriptionPage() {
  const subscription = useProviderStore((state) => state.subscription);
  const purchaseHistory = useProviderStore((state) => state.purchaseHistory);
  const purchaseSubscription = useProviderStore(
    (state) => state.purchaseSubscription,
  );

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const isActive = hasActiveSubscription(subscription);
  const remainingDays = subscription ? getRemainingDays(subscription.endDate) : 0;
  const totalDays = subscription
    ? Math.max(
        1,
        Math.ceil(
          (new Date(subscription.endDate).getTime() -
            new Date(subscription.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 1;
  const progress = subscription
    ? Math.min(100, Math.round((remainingDays / totalDays) * 100))
    : 0;

  const handlePurchase = () => {
    if (!selectedPlanId) return;

    const plan = SUBSCRIPTION_PLANS.find((item) => item.id === selectedPlanId);
    if (!plan) return;

    purchaseSubscription(plan.id, plan.durationMonths, plan.price);
    setSelectedPlanId(null);
    toast.success("اشتراک با موفقیت فعال شد");
  };

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
                {subscription
                  ? SUBSCRIPTION_PLANS.find(
                      (plan) => plan.id === subscription.planId,
                    )?.name ?? "اشتراک"
                  : "بدون اشتراک"}
              </p>
            </div>
            <Badge
              className={cn(
                isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              )}
            >
              {isActive ? "فعال" : "منقضی"}
            </Badge>
          </div>

          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">شروع</p>
                  <p className="font-medium">{formatDate(subscription.startDate)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">انقضا</p>
                  <p className="font-medium">{formatDate(subscription.endDate)}</p>
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
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isPro = plan.id === "plan-pro";

          return (
            <Card
              key={plan.id}
              className={cn(
                "overflow-hidden border-border/70 transition-all",
                isPro && "border-primary/30 shadow-md",
              )}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{plan.name}</p>
                      {isPro ? (
                        <Badge className="bg-primary/10 text-primary">
                          <Sparkles className="size-3" />
                          پیشنهادی
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {toPersianDigits(plan.durationMonths)} ماه دسترسی
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(plan.price)}
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    نمایش در جستجوی خدمات‌گیرنده
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" />
                    دریافت درخواست‌های جدید
                  </li>
                </ul>

                <Button
                  type="button"
                  className="h-11 w-full rounded-xl"
                  variant={isPro ? "default" : "outline"}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <CreditCard className="size-4" />
                  خرید {plan.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {purchaseHistory.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">تاریخچه خرید</h2>
          {purchaseHistory.map((record, index) => {
            const plan = SUBSCRIPTION_PLANS.find(
              (item) => item.id === record.planId,
            );

            return (
              <Card key={`${record.purchasedAt}-${index}`} className="border-border/70">
                <CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{plan?.name ?? "اشتراک"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(record.purchasedAt)}
                    </p>
                  </div>
                  <p className="font-semibold text-primary">
                    {formatPrice(record.price)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ) : null}

      <ConfirmDialog
        open={selectedPlanId !== null}
        onOpenChange={(open) => !open && setSelectedPlanId(null)}
        title="تأیید خرید اشتراک"
        description="خرید به‌صورت Mock انجام می‌شود و بدون پرداخت واقعی فعال خواهد شد."
        confirmLabel="تأیید خرید"
        onConfirm={handlePurchase}
      />
    </PageContainer>
  );
}
