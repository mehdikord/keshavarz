"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Clock3, Inbox, RotateCw, Search, UserRoundCheck, Wrench } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import { BillingHistory } from "@/components/providers-panel/subscription/billing-history";
import { CheckoutSheet } from "@/components/providers-panel/subscription/checkout-sheet";
import { MembershipCard } from "@/components/providers-panel/subscription/membership-card";
import { PlanCard } from "@/components/providers-panel/subscription/plan-card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiClientError } from "@/lib/api/envelope";
import { fetchAppPayments, type AppPaymentSummary } from "@/lib/api/app-payments";
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
import { isPaymentPending } from "@/lib/subscriptions/labels";
import { toast } from "@/lib/toast";

const BENEFITS = [
  { icon: Search, title: "دیده شدن در جستجو", text: "کشاورزان منطقه شما را در نتایج پیدا می‌کنند." },
  { icon: Inbox, title: "دریافت درخواست", text: "درخواست کار مستقیم برای شما ارسال می‌شود." },
  { icon: UserRoundCheck, title: "پروفایل عمومی", text: "خدمات، قیمت‌ها و نمونه‌کارهایتان نمایش داده می‌شود." },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function ProviderSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [plans, setPlans] = useState<AppSubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<AppActiveSubscription | null>(null);
  const [history, setHistory] = useState<AppSubscriptionHistoryItem[]>([]);
  const [payments, setPayments] = useState<AppPaymentSummary[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [purchasing, startPurchase] = useTransition();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const [planList, current, historyResult, paymentsResult] = await Promise.all([
          fetchAppSubscriptionPlans(controller.signal),
          fetchAppProviderSubscription(controller.signal).catch((cause: unknown) => {
            if (isApiClientError(cause) && cause.status === 404) {
              setNeedsProfile(true);
              return null;
            }
            throw cause;
          }),
          fetchAppProviderSubscriptions({ limit: 20, signal: controller.signal }).catch(
            (cause: unknown) => {
              if (isApiClientError(cause) && cause.status === 404) {
                return { items: [] as AppSubscriptionHistoryItem[] };
              }
              throw cause;
            },
          ),
          fetchAppPayments({ limit: 20, signal: controller.signal }),
        ]);

        if (controller.signal.aborted) return;

        const sorted = [...planList].sort((a, b) => a.sortOrder - b.sortOrder);
        setPlans(sorted);
        setSelectedCode((sorted.find((plan) => plan.isRecommended) ?? sorted[0])?.code ?? null);
        setSubscription(isAppSubscriptionActive(current) ? current : null);
        setHistory(historyResult.items);
        setPayments(paymentsResult.items);
        setError(null);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setError(isApiClientError(cause) ? cause.message : "بارگذاری اشتراک ناموفق بود");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [reloadKey]);

  const selectedPlan = plans.find((plan) => plan.code === selectedCode) ?? null;
  const pendingPayment = payments.find((payment) => isPaymentPending(payment.status));
  const isActive = subscription !== null;

  const handlePurchase = () => {
    if (!selectedPlan) return;

    startPurchase(async () => {
      try {
        const result = await purchaseAppProviderSubscription({ planCode: selectedPlan.code });
        toast.success("در حال تأیید پرداخت…");
        router.push(
          `/providers/subscription/return?paymentId=${encodeURIComponent(result.paymentId)}`,
        );
      } catch (cause: unknown) {
        toast.error(isApiClientError(cause) ? cause.message : "شروع خرید اشتراک ناموفق بود");
      }
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero
          title="اشتراک"
          subtitle="با اشتراک فعال، کشاورزان منطقه شما را می‌بینند و برایتان درخواست می‌فرستند."
        >
          {loading ? (
            <div className="mt-5 h-[188px] animate-pulse rounded-[26px] bg-white/10" />
          ) : !error && !needsProfile ? (
            <MembershipCard subscription={subscription} />
          ) : null}
        </ProviderPageHero>

        <div className="relative z-10 -mt-4 space-y-6 px-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-52 rounded-[26px]" />
              <Skeleton className="h-52 rounded-[26px]" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-10 text-center ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <RotateCw className="size-3.5" />
                تلاش مجدد
              </button>
            </div>
          ) : needsProfile ? (
            <div className="flex flex-col items-center rounded-[26px] bg-[linear-gradient(160deg,#fff6e6_0%,#ffffff_75%)] px-6 py-8 text-center ring-1 ring-[#e9c46a]/40">
              <span className="flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#ffb85c] to-[#e07b1f] text-white">
                <Wrench className="size-8" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-[16px] font-black">ابتدا پروفایل خود را بسازید</h2>
              <p className="mt-1.5 max-w-72 text-[12px] leading-6 text-muted-foreground">
                قبل از خرید اشتراک، خدمات و محدوده کاری خود را ثبت کنید.
              </p>
              <Link
                href="/providers/services"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-[13.5px] font-black text-primary-foreground"
              >
                تنظیم خدمات
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              {pendingPayment ? (
                <Reveal>
                  <Link
                    href={`/providers/subscription/return?paymentId=${encodeURIComponent(pendingPayment.paymentId)}`}
                    className="flex items-center gap-3 rounded-[22px] bg-[#fdefd6] px-4 py-3 ring-1 ring-[#e9c46a]/50"
                  >
                    <Clock3 className="size-5 shrink-0 text-[#b4661a]" />
                    <span className="min-w-0 flex-1 text-[12px] leading-5 text-[#6b4210]">
                      یک پرداخت در انتظار تأیید دارید. برای بررسی وضعیت ضربه بزنید.
                    </span>
                    <ArrowLeft className="size-4 shrink-0 text-[#b4661a]" />
                  </Link>
                </Reveal>
              ) : null}

              {!isActive ? (
                <Reveal>
                  <section className="space-y-3 rounded-[24px] bg-surface p-4 ring-1 ring-border/60">
                    <h2 className="text-[13.5px] font-black text-foreground">با اشتراک چه چیزی به دست می‌آورید؟</h2>
                    <ul className="space-y-3">
                      {BENEFITS.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                          <li key={benefit.title} className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d8f3dc] text-[#2d6a4f]">
                              <Icon className="size-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-black text-foreground">{benefit.title}</span>
                              <span className="block text-[11.5px] leading-5 text-muted-foreground">{benefit.text}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                </Reveal>
              ) : null}

              <Reveal delay={0.08}>
                <section aria-labelledby="plans-title">
                  <div className="mb-3 px-1">
                    <h2 id="plans-title" className="text-[15px] font-black text-foreground">
                      {isActive ? "تمدید اشتراک" : "انتخاب طرح"}
                    </h2>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {isActive
                        ? "با تمدید، مدت جدید به انتهای اشتراک فعلی اضافه می‌شود."
                        : "طرح مناسب خود را انتخاب کنید."}
                    </p>
                  </div>

                  {plans.length === 0 ? (
                    <p className="rounded-[22px] bg-surface px-4 py-8 text-center text-[12px] text-muted-foreground ring-1 ring-border/60">
                      در حال حاضر طرح فعالی برای خرید وجود ندارد.
                    </p>
                  ) : (
                    <div role="radiogroup" aria-labelledby="plans-title" className="space-y-3">
                      {plans.map((plan) => (
                        <PlanCard
                          key={plan.planId}
                          plan={plan}
                          selected={plan.code === selectedCode}
                          onSelect={() => setSelectedCode(plan.code)}
                        />
                      ))}
                    </div>
                  )}

                  {selectedPlan ? (
                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(true)}
                      className="mt-4 flex w-full items-center justify-between gap-3 rounded-[22px] bg-primary py-3 pe-3 ps-5 text-primary-foreground shadow-[0_18px_36px_-18px_rgba(45,106,79,0.95)] transition active:scale-[0.98]"
                    >
                      <span className="text-right">
                        <span className="block text-[14px] font-black">
                          {isActive ? "تمدید با" : "خرید"} {selectedPlan.name}
                        </span>
                        <span className="block text-[11px] text-primary-foreground/75">
                          {new Intl.NumberFormat("fa-IR").format(selectedPlan.priceToman)} تومان
                        </span>
                      </span>
                      <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary">
                        <ArrowLeft className="size-5" strokeWidth={2.25} />
                      </span>
                    </button>
                  ) : null}
                </section>
              </Reveal>

              <Reveal delay={0.16}>
                <BillingHistory payments={payments} subscriptions={history} />
              </Reveal>
            </>
          )}
        </div>

        <CheckoutSheet
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          plan={selectedPlan}
          current={subscription}
          purchasing={purchasing}
          onConfirm={handlePurchase}
        />
      </PageContainer>
    </MotionConfig>
  );
}
