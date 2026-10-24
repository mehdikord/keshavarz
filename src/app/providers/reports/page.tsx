"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarRange,
  ChartNoAxesColumn,
  ClipboardCheck,
  Coins,
  RotateCw,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProviderPageHero } from "@/components/providers-panel/provider-page-hero";
import { RevenueChart } from "@/components/providers-panel/reports/revenue-chart";
import {
  ServiceBreakdown,
  type ServiceRevenueRow,
} from "@/components/providers-panel/reports/service-breakdown";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppProviderServices, type AppProviderService } from "@/lib/api/app-provider";
import {
  fetchProviderFinancialSummary,
  fetchProviderMonthlyRevenue,
  type AppProviderFinancialSummary,
  type AppProviderMonthlyRevenue,
} from "@/lib/api/app-reports";
import { isApiClientError } from "@/lib/api/envelope";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";

const DAY_MS = 86_400_000;
/** Per-service breakdown issues one request per service, so keep it bounded. */
const MAX_BREAKDOWN_SERVICES = 8;

const RANGES = [
  { key: "7d", label: "۷ روز", caption: "۷ روز اخیر", days: 7 },
  { key: "30d", label: "۳۰ روز", caption: "۳۰ روز اخیر", days: 30 },
  { key: "90d", label: "۳ ماه", caption: "۳ ماه اخیر", days: 90 },
  { key: "365d", label: "یک سال", caption: "یک سال اخیر", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const FULL = new Intl.NumberFormat("fa-IR");
const COMPACT = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const MONTH_YEAR = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "numeric" });

interface RangeData {
  current: AppProviderFinancialSummary;
  previous: AppProviderFinancialSummary;
  services: ServiceRevenueRow[];
}

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

export default function ProviderReportsPage() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [reloadKey, setReloadKey] = useState(0);
  const [baseState, setBaseState] = useState<"loading" | "ready" | "error" | "needs_profile">("loading");
  const [baseError, setBaseError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<AppProviderMonthlyRevenue | null>(null);
  const [services, setServices] = useState<AppProviderService[]>([]);
  const [rangeData, setRangeData] = useState<(RangeData & { key: RangeKey }) | null>(null);

  const range = RANGES.find((item) => item.key === rangeKey) ?? RANGES[1];

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchProviderMonthlyRevenue({ signal: controller.signal }),
      fetchAppProviderServices({ limit: 50, signal: controller.signal }),
    ])
      .then(([monthlyRevenue, serviceList]) => {
        if (controller.signal.aborted) return;
        setMonthly(monthlyRevenue);
        setServices(serviceList.items);
        setBaseState("ready");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        if (isApiClientError(cause) && cause.status === 404) {
          setBaseState("needs_profile");
          return;
        }
        setBaseError(isApiClientError(cause) ? cause.message : "بارگذاری گزارش‌ها ناموفق بود");
        setBaseState("error");
      });

    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => {
    if (baseState !== "ready") return;
    const controller = new AbortController();
    const to = new Date();
    const from = new Date(to.getTime() - range.days * DAY_MS);
    const previousFrom = new Date(from.getTime() - range.days * DAY_MS);
    const breakdownServices = services.filter((item) => item.isActive).slice(0, MAX_BREAKDOWN_SERVICES);

    Promise.all([
      fetchProviderFinancialSummary({ from: from.toISOString(), to: to.toISOString(), signal: controller.signal }),
      fetchProviderFinancialSummary({ from: previousFrom.toISOString(), to: from.toISOString(), signal: controller.signal }),
      Promise.all(
        breakdownServices.map((service) =>
          fetchProviderFinancialSummary({
            from: from.toISOString(),
            to: to.toISOString(),
            serviceId: service.serviceId,
            signal: controller.signal,
          }).then((summary) => ({
            serviceId: service.serviceId,
            name: service.serviceName,
            totalToman: summary.totalRevenueToman,
            completedCount: summary.completedCount,
          })),
        ),
      ),
    ])
      .then(([current, previous, serviceRows]) => {
        if (controller.signal.aborted) return;
        setRangeData({ key: range.key, current, previous, services: serviceRows });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setBaseError(isApiClientError(cause) ? cause.message : "بارگذاری گزارش‌ها ناموفق بود");
        setBaseState("error");
      });

    return () => controller.abort();
  }, [baseState, range.days, range.key, services]);

  const rangeLoading = rangeData?.key !== rangeKey;

  const bestMonth = useMemo(() => {
    const months = monthly?.months ?? [];
    return months.reduce<(typeof months)[number] | null>(
      (best, row) => (row.totalToman > (best?.totalToman ?? 0) ? row : best),
      null,
    );
  }, [monthly]);

  const current = rangeData?.current;
  const previous = rangeData?.previous;
  const total = current?.totalRevenueToman ?? 0;
  const count = current?.completedCount ?? 0;
  const average = count > 0 ? Math.round(total / count) : 0;
  const change =
    previous && previous.totalRevenueToman > 0
      ? Math.round(((total - previous.totalRevenueToman) / previous.totalRevenueToman) * 100)
      : null;
  const hasAnyRevenue =
    (current?.annualRevenueToman ?? 0) > 0 || (monthly?.months ?? []).some((row) => row.totalToman > 0);

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ProviderPageHero title="گزارش‌ها" subtitle="درآمد و عملکرد کاری خود را در یک نگاه ببینید.">
          {baseState === "ready" || baseState === "loading" ? (
            <div className="mt-5 rounded-[24px] bg-white/[0.08] p-4 ring-1 ring-white/12 backdrop-blur-xl">
              <div role="tablist" aria-label="بازه زمانی" className="grid grid-cols-4 gap-1 rounded-2xl bg-black/15 p-1">
                {RANGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={item.key === rangeKey}
                    onClick={() => setRangeKey(item.key)}
                    className={cn(
                      "relative h-9 rounded-xl text-[12px] font-bold transition-colors",
                      item.key === rangeKey ? "text-[#0f3324]" : "text-white/70 hover:text-white",
                    )}
                  >
                    {item.key === rangeKey ? (
                      <motion.span
                        layoutId="report-range"
                        className="absolute inset-0 rounded-xl bg-white shadow-sm"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    ) : null}
                    <span className="relative">{item.label}</span>
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[11.5px] text-white/60">درآمد {range.caption}</p>
              {rangeLoading && !rangeData ? (
                <div className="mt-2 h-10 w-52 animate-pulse rounded-xl bg-white/15" />
              ) : (
                <div className={cn("transition-opacity", rangeLoading && "opacity-60")}>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-[36px] font-black leading-none tracking-tight tabular-nums">
                      {FULL.format(total)}
                    </span>
                    <span className="text-sm font-bold text-[#95d5b2]">تومان</span>
                  </p>
                  {change !== null ? (
                    <p
                      className={cn(
                        "mt-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black",
                        change >= 0 ? "bg-[#74e0a3]/20 text-[#b7f5cf]" : "bg-[#f28b74]/20 text-[#ffc7b8]",
                      )}
                    >
                      {change >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      {toPersianDigits(Math.abs(change))}٪ {change >= 0 ? "بیشتر" : "کمتر"} از دوره قبل
                    </p>
                  ) : (
                    <p className="mt-2.5 text-[11px] text-white/50">داده‌ای برای مقایسه با دوره قبل نیست</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </ProviderPageHero>

        <div className="relative z-10 -mt-4 space-y-4 px-4">
          {baseState === "loading" ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-[24px]" />
              <Skeleton className="h-72 rounded-[26px]" />
            </div>
          ) : baseState === "needs_profile" ? (
            <div className="flex flex-col items-center rounded-[26px] bg-surface px-6 py-8 text-center ring-1 ring-border/60">
              <span className="flex size-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-[#ffb85c] to-[#e07b1f] text-white">
                <Wrench className="size-8" strokeWidth={1.75} />
              </span>
              <h2 className="mt-4 text-[16px] font-black">ابتدا پروفایل خود را بسازید</h2>
              <p className="mt-1.5 max-w-72 text-[12px] leading-6 text-muted-foreground">
                پس از ثبت خدمات و انجام اولین کار، گزارش درآمد اینجا نمایش داده می‌شود.
              </p>
              <Link
                href="/providers/services"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-[13.5px] font-black text-primary-foreground"
              >
                تنظیم خدمات
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          ) : baseState === "error" ? (
            <div className="flex flex-col items-center gap-3 rounded-[24px] bg-surface px-6 py-10 text-center ring-1 ring-border/60">
              <p className="text-sm text-muted-foreground">{baseError}</p>
              <button
                type="button"
                onClick={() => {
                  setBaseState("loading");
                  setRangeData(null);
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <RotateCw className="size-3.5" />
                تلاش مجدد
              </button>
            </div>
          ) : (
            <>
              <Reveal>
                <section aria-label="شاخص‌های بازه" className="grid grid-cols-3 gap-2">
                  {[
                    { icon: ClipboardCheck, label: "کار انجام‌شده", value: toPersianDigits(count), tone: "bg-[#d8f3dc] text-[#2d6a4f]" },
                    { icon: Coins, label: "میانگین هر کار", value: average > 0 ? COMPACT.format(average) : "۰", tone: "bg-[#fdefd6] text-[#b4661a]" },
                    { icon: CalendarRange, label: "درآمد امسال", value: COMPACT.format(current?.annualRevenueToman ?? 0), tone: "bg-[#e3f4ff] text-sky-700" },
                  ].map((tile) => {
                    const Icon = tile.icon;
                    return (
                      <div
                        key={tile.label}
                        className={cn(
                          "rounded-[22px] bg-surface p-3 shadow-[0_14px_30px_-22px_rgba(45,106,79,0.5)] ring-1 ring-border/60 transition-opacity",
                          rangeLoading && "opacity-60",
                        )}
                      >
                        <span className={cn("flex size-9 items-center justify-center rounded-xl", tile.tone)}>
                          <Icon className="size-[18px]" />
                        </span>
                        <p className="mt-2.5 text-[18px] font-black leading-none tabular-nums text-foreground">{tile.value}</p>
                        <p className="mt-1 text-[10.5px] font-bold text-muted-foreground">{tile.label}</p>
                      </div>
                    );
                  })}
                </section>
              </Reveal>

              {!hasAnyRevenue && !rangeLoading ? (
                <Reveal delay={0.06}>
                  <div className="flex flex-col items-center rounded-[26px] border-2 border-dashed border-border bg-surface/60 px-6 py-9 text-center">
                    <span className="flex size-14 items-center justify-center rounded-[20px] bg-muted text-muted-foreground">
                      <ChartNoAxesColumn className="size-7" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-3 text-[15px] font-black">هنوز درآمدی ثبت نشده</h2>
                    <p className="mt-1 max-w-72 text-[12px] leading-6 text-muted-foreground">
                      وقتی کشاورز کاری را تکمیل‌شده اعلام کند، درآمد آن در این گزارش‌ها نمایش داده می‌شود.
                    </p>
                    <Link
                      href="/providers/requests"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-[12px] font-bold text-primary"
                    >
                      مشاهده درخواست‌ها
                      <ArrowLeft className="size-3.5" />
                    </Link>
                  </div>
                </Reveal>
              ) : (
                <>
                  {monthly && monthly.months.length > 0 ? (
                    <Reveal delay={0.06}>
                      <RevenueChart months={monthly.months} />
                    </Reveal>
                  ) : null}

                  <Reveal delay={0.12}>
                    <section aria-label="نکات برجسته" className="grid grid-cols-2 gap-2">
                      <div className="rounded-[22px] bg-[linear-gradient(150deg,#fff6e6_0%,#ffffff_80%)] p-3.5 ring-1 ring-[#e9c46a]/40">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#9a5b13]">
                          <Trophy className="size-3.5" />
                          پردرآمدترین خدمت
                        </p>
                        <p className="mt-1.5 truncate text-[13.5px] font-black text-foreground">
                          {current?.topService?.name ?? "—"}
                        </p>
                        {current?.topService ? (
                          <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                            {FULL.format(current.topService.totalToman)} تومان
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">در این بازه</p>
                        )}
                      </div>
                      <div className="rounded-[22px] bg-[linear-gradient(150deg,#e9f7ee_0%,#ffffff_80%)] p-3.5 ring-1 ring-[#95d5b2]/40">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#2d6a4f]">
                          <TrendingUp className="size-3.5" />
                          بهترین ماه
                        </p>
                        <p className="mt-1.5 truncate text-[13.5px] font-black text-foreground">
                          {bestMonth ? MONTH_YEAR.format(new Date(bestMonth.year, bestMonth.month - 1, 15)) : "—"}
                        </p>
                        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {bestMonth ? `${FULL.format(bestMonth.totalToman)} تومان` : "در ۱۲ ماه اخیر"}
                        </p>
                      </div>
                    </section>
                  </Reveal>

                  {services.some((item) => item.isActive) ? (
                    <Reveal delay={0.18}>
                      <ServiceBreakdown rows={rangeData?.services ?? []} loading={rangeLoading} />
                    </Reveal>
                  ) : null}
                </>
              )}

              <p className="px-2 text-center text-[10.5px] leading-5 text-muted-foreground">
                گزارش‌ها فقط کارهایی را شامل می‌شوند که کشاورز تکمیل‌شده اعلام کرده است.
              </p>
            </>
          )}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}
