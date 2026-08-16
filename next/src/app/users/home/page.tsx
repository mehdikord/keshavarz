"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  ClipboardList,
  MapPin,
  Search,
  Wallet,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAppLands } from "@/lib/api/app-lands";
import {
  fetchAppNotifications,
  markAllAppNotificationsRead,
  markAppNotificationRead,
  resolveAppNotificationHref,
  type AppNotification,
} from "@/lib/api/app-notifications";
import { fetchConsumerFinancialSummary } from "@/lib/api/app-reports";
import { fetchConsumerRequests } from "@/lib/api/app-requests";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

function formatCompactToman(amount: number): string {
  if (amount <= 0) return "۰";
  if (amount >= 1_000_000) {
    return `${toPersianDigits(Math.round(amount / 1_000_000))}M`;
  }
  return `${toPersianDigits(Math.round(amount / 1000))}K`;
}

export default function ConsumerHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [landsCount, setLandsCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, startMarkAll] = useTransition();

  useEffect(() => {
    if (!user) return;

    const controller = new AbortController();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    void Promise.all([
      fetchAppLands({ limit: 50, signal: controller.signal }),
      fetchConsumerRequests({
        status: "pending_provider",
        limit: 50,
        signal: controller.signal,
      }),
      fetchConsumerRequests({
        status: "in_progress",
        limit: 50,
        signal: controller.signal,
      }),
      fetchConsumerFinancialSummary({
        from: monthStart.toISOString(),
        signal: controller.signal,
        to: nextMonth.toISOString(),
      }),
      fetchAppNotifications({
        limit: 20,
        signal: controller.signal,
      }),
    ])
      .then(
        ([
          landsResult,
          pendingResult,
          inProgressResult,
          monthSummary,
          notificationsResult,
        ]) => {
          if (controller.signal.aborted) return;

          setLandsCount(landsResult.items.length);
          setPendingCount(pendingResult.items.length);
          setInProgressCount(inProgressResult.items.length);
          setMonthlyCost(monthSummary.totalCostToman);
          setNotifications(notificationsResult.items.slice(0, 3));
        },
      )
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری داشبورد ناموفق بود",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <PageContainer withDock>
        <PageHeader title="داشبورد" />
        <LoadingSpinner className="py-16" />
      </PageContainer>
    );
  }

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
      }
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "خواندن اعلان ناموفق بود",
      );
    }
    router.push(resolveAppNotificationHref(notification, "consumer"));
  };

  const handleMarkAllRead = () => {
    startMarkAll(async () => {
      try {
        await markAllAppNotificationsRead();
        setNotifications((current) =>
          current.map((item) =>
            item.readAt
              ? item
              : { ...item, readAt: new Date().toISOString() },
          ),
        );
      } catch (cause: unknown) {
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "خواندن همه اعلان‌ها ناموفق بود",
        );
      }
    });
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="داشبورد"
        description={`سلام ${user.displayName}، آماده جستجوی خدمات هستید؟`}
      />

      {landsCount === 0 ? (
        <Card className="mb-4 overflow-hidden border-accent/25 bg-gradient-to-l from-accent/10 to-transparent">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                ابتدا زمین خود را ثبت کنید
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                برای جستجوی خدمات کشاورزی، حداقل یک زمین نیاز دارید.
              </p>
              <Button asChild size="sm" className="mt-3 rounded-xl">
                <Link href="/users/lands/new">افزودن زمین</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 animate-slide-up">
        <StatCard
          label="در انتظار تأیید"
          value={pendingCount}
          icon={ClipboardList}
        />
        <StatCard label="در حال انجام" value={inProgressCount} icon={Search} />
        <StatCard
          label="هزینه ماه"
          value={formatCompactToman(monthlyCost)}
          icon={Wallet}
        />
        <StatCard label="زمین‌های من" value={landsCount} icon={MapPin} />
      </div>

      <section className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">اعلان‌های اخیر</h2>
          <div className="flex items-center gap-2">
            {notifications.some((item) => !item.readAt) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs"
                disabled={markingAll}
                onClick={handleMarkAllRead}
              >
                خواندن همه
              </Button>
            ) : null}
            <Bell className="size-4 text-muted-foreground" />
          </div>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.notificationId}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 text-right transition-colors hover:bg-muted/40"
              >
                <span
                  className={
                    notification.readAt
                      ? "mt-1 size-2 shrink-0 rounded-full bg-transparent"
                      : "mt-1 size-2 shrink-0 rounded-full bg-accent"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {notification.body}
                  </p>
                </div>
                <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              اعلان جدیدی ندارید
            </CardContent>
          </Card>
        )}
      </section>

      <Button
        asChild
        className="h-12 w-full rounded-xl bg-gradient-to-l from-accent to-[#e76f51] text-white hover:opacity-95"
      >
        <Link href="/users/search">
          <Search className="size-5" />
          جستجوی خدمات
        </Link>
      </Button>
    </PageContainer>
  );
}
