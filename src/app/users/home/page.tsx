"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { ArrowLeft, Bell, Hourglass, Search, Tractor, Wallet } from "lucide-react";

import { ActiveRequests } from "@/components/consumer-panel/dashboard/active-requests";
import { LandWeatherCard } from "@/components/consumer-panel/dashboard/land-weather-card";
import { MyLands } from "@/components/consumer-panel/dashboard/my-lands";
import { OnboardingCard } from "@/components/consumer-panel/dashboard/onboarding-card";
import { ConsumerHeroShell, HARVEST_GLASS_BUTTON } from "@/components/consumer-panel/consumer-hero";
import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { PageContainer } from "@/components/layout/page-container";
import { RecentNotifications } from "@/components/shared/recent-notifications";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAppLands, type AppLand } from "@/lib/api/app-lands";
import {
  fetchAppNotifications,
  fetchAppUnreadNotificationCount,
  markAllAppNotificationsRead,
  markAppNotificationRead,
  resolveAppNotificationHref,
  type AppNotification,
} from "@/lib/api/app-notifications";
import { fetchConsumerFinancialSummary } from "@/lib/api/app-reports";
import { fetchConsumerRequests, type AppConsumerRequestSummary } from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toPersianDigits } from "@/lib/utils/format";
import { fetchWeather } from "@/lib/weather/client";
import { useAuthStore } from "@/stores/auth-store";
import type { WeatherForecastResponse } from "@/types/weather";

const COMPACT = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "صبح بخیر";
  if (hour >= 12 && hour < 16) return "ظهر بخیر";
  if (hour >= 16 && hour < 19) return "عصر بخیر";
  return "شب بخیر";
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

export default function ConsumerHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);

  const [loading, setLoading] = useState(true);
  const [lands, setLands] = useState<AppLand[]>([]);
  const [pending, setPending] = useState<AppConsumerRequestSummary[]>([]);
  const [inProgress, setInProgress] = useState<AppConsumerRequestSummary[]>([]);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [weather, setWeather] = useState<WeatherForecastResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [greeting] = useState(() => greetingFor(new Date().getHours()));
  const [markingAll, startMarkAll] = useTransition();

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    void Promise.all([
      fetchAppLands({ limit: 50, signal: controller.signal }),
      fetchConsumerRequests({ status: "pending_provider", limit: 50, signal: controller.signal }),
      fetchConsumerRequests({ status: "in_progress", limit: 50, signal: controller.signal }),
      fetchConsumerFinancialSummary({
        from: monthStart.toISOString(),
        signal: controller.signal,
        to: nextMonth.toISOString(),
      }),
      fetchAppNotifications({ limit: 20, signal: controller.signal }),
      fetchAppUnreadNotificationCount(controller.signal),
    ])
      .then(([landsResult, pendingResult, inProgressResult, monthSummary, notificationsResult, unread]) => {
        if (controller.signal.aborted) return;

        setLands(landsResult.items);
        setPending(pendingResult.items);
        setInProgress(inProgressResult.items);
        setMonthlyCost(monthSummary.totalCostToman);
        setNotifications(notificationsResult.items.slice(0, 3));
        setUnreadCount(unread);

        const firstLand = landsResult.items[0];
        if (firstLand) {
          setWeatherLoading(true);
          fetchWeather({ lat: Number(firstLand.latitude), lng: Number(firstLand.longitude) })
            .then((result) => {
              if (!controller.signal.aborted) setWeather(result);
            })
            .catch(() => undefined) // Weather is a nice-to-have; the card just hides.
            .finally(() => {
              if (!controller.signal.aborted) setWeatherLoading(false);
            });
        }
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(isApiClientError(cause) ? cause.message : "بارگذاری داشبورد ناموفق بود");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  if (!user) return null;

  const activeRequests = [...inProgress, ...pending]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const firstLand = lands[0];

  const handleNotificationClick = async (notification: AppNotification) => {
    try {
      if (!notification.readAt) {
        await markAppNotificationRead(notification.notificationId);
        setNotifications((current) =>
          current.map((item) =>
            item.notificationId === notification.notificationId
              ? { ...item, readAt: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (cause: unknown) {
      toast.error(isApiClientError(cause) ? cause.message : "خواندن اعلان ناموفق بود");
    }
    router.push(resolveAppNotificationHref(notification, "consumer"));
  };

  const handleMarkAllRead = () => {
    startMarkAll(async () => {
      try {
        await markAllAppNotificationsRead();
        setNotifications((current) =>
          current.map((item) => (item.readAt ? item : { ...item, readAt: new Date().toISOString() })),
        );
        setUnreadCount(0);
      } catch (cause: unknown) {
        toast.error(isApiClientError(cause) ? cause.message : "خواندن همه اعلان‌ها ناموفق بود");
      }
    });
  };

  const stats = [
    { icon: Hourglass, label: "منتظر پاسخ", value: toPersianDigits(pending.length) },
    { icon: Tractor, label: "در حال انجام", value: toPersianDigits(inProgress.length) },
    { icon: Wallet, label: "هزینه این ماه", value: monthlyCost > 0 ? COMPACT.format(monthlyCost) : "۰" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <ConsumerHeroShell>
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-[#ffffff] to-[#e8892c] p-[2px]">
                <UserAvatar name={user.displayName} src={image} size="md" className="border-2 border-[#ffe3ad]" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="text-[11px] font-bold text-[#a0561a]">{greeting}</p>
                <h1 className="truncate text-lg font-black">{user.displayName}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href="#recent-notifications" aria-label="اعلان‌ها" className={cn(HARVEST_GLASS_BUTTON, "relative")}>
                <Bell className="size-5" strokeWidth={1.75} />
                {unreadCount > 0 ? (
                  <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b9531f] px-1 text-[10px] font-black text-white ring-2 ring-[#ffe8bd]">
                    {toPersianDigits(unreadCount > 9 ? "9+" : unreadCount)}
                  </span>
                ) : null}
              </a>
              <AppMenuTrigger className={cn(HARVEST_GLASS_BUTTON, "hover:text-[#4a2e12]")} />
            </div>
          </header>

          <h2 className="mt-6 text-[22px] font-black leading-snug tracking-tight">
            امروز زمینتان
            <br />
            به چه خدمتی نیاز دارد؟
          </h2>

          <Link
            href="/users/search"
            className="group mt-4 flex items-center gap-3 rounded-[22px] bg-white/90 p-2 pr-4 shadow-[0_18px_36px_-18px_rgba(138,69,18,0.55)] ring-1 ring-white backdrop-blur transition active:scale-[0.98]"
          >
            <Search className="size-5 shrink-0 text-[#b9531f]" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-[#8a6a48]">شخم، سم‌پاشی، برداشت و…</span>
            <span className="flex h-10 shrink-0 items-center gap-1 rounded-2xl bg-[#b9531f] px-4 text-[12.5px] font-black text-white transition-transform group-hover:-translate-x-0.5">
              جستجو
              <ArrowLeft className="size-4" />
            </span>
          </Link>

          <dl className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl bg-white/45 px-3 py-2.5 ring-1 ring-white/70 backdrop-blur-md">
                  <dt className="flex items-center gap-1 truncate text-[10.5px] font-bold text-[#8a5a2b]">
                    <Icon className="size-3.5 shrink-0" />
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-[16px] font-black tabular-nums">{loading ? "…" : stat.value}</dd>
                </div>
              );
            })}
          </dl>
        </ConsumerHeroShell>

        <div className="relative z-10 -mt-4 space-y-6 px-4 pt-1">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-36 rounded-[24px] bg-white/70" />
              <Skeleton className="h-48 rounded-[26px] bg-white/70" />
            </div>
          ) : (
            <>
              {lands.length === 0 ? (
                <Reveal>
                  <OnboardingCard />
                </Reveal>
              ) : null}

              <Reveal delay={0.06}>
                <ActiveRequests requests={activeRequests} total={pending.length + inProgress.length} />
              </Reveal>

              {firstLand ? (
                <Reveal delay={0.12}>
                  <LandWeatherCard landTitle={firstLand.title} weather={weather} loading={weatherLoading} />
                </Reveal>
              ) : null}

              {lands.length > 0 ? (
                <Reveal delay={0.18}>
                  <MyLands lands={lands} />
                </Reveal>
              ) : null}

              <Reveal delay={0.24}>
                <RecentNotifications
                  notifications={notifications}
                  markingAll={markingAll}
                  onMarkAllRead={handleMarkAllRead}
                  onOpen={(notification) => void handleNotificationClick(notification)}
                />
              </Reveal>
            </>
          )}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}
