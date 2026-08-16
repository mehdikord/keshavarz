"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CircleDollarSign,
  ClipboardList,
  LoaderCircle,
  Tractor,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiClientError } from "@/lib/api/envelope";
import {
  fetchAppNotifications,
  markAllAppNotificationsRead,
  markAppNotificationRead,
  resolveAppNotificationHref,
  type AppNotification,
} from "@/lib/api/app-notifications";
import {
  fetchAppProviderDashboard,
  fetchAppProviderServices,
  type AppProviderDashboard,
} from "@/lib/api/app-provider";
import {
  fetchAppProviderSubscription,
  isAppSubscriptionActive,
} from "@/lib/api/app-subscriptions";
import { toast } from "@/lib/toast";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

type DashboardLoadState = "loading" | "ready" | "needs_profile";

function formatMonthlyRevenue(amount: number): string {
  if (amount <= 0) return "۰";
  if (amount >= 1_000_000) {
    return `${toPersianDigits((amount / 1_000_000).toFixed(1))}M`;
  }
  return `${toPersianDigits(Math.round(amount / 1000))}K`;
}

export default function ProviderHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [loadState, setLoadState] = useState<DashboardLoadState>("loading");
  const [dashboard, setDashboard] = useState<AppProviderDashboard | null>(null);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [markingAll, startMarkAll] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const [dash, services, subscription, notificationsResult] =
          await Promise.all([
            fetchAppProviderDashboard(controller.signal),
            fetchAppProviderServices({
              signal: controller.signal,
              limit: 50,
            }),
            fetchAppProviderSubscription(controller.signal).catch(
              (cause: unknown) => {
                if (isApiClientError(cause) && cause.status === 404) {
                  return null;
                }
                throw cause;
              },
            ),
            fetchAppNotifications({
              limit: 20,
              signal: controller.signal,
            }),
          ]);

        if (cancelled) return;

        setDashboard(dash);
        setActiveServicesCount(
          services.items.filter((item) => item.isActive).length,
        );
        setHasSubscription(isAppSubscriptionActive(subscription));
        setNotifications(notificationsResult.items.slice(0, 3));
        setLoadState("ready");
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;

        if (isApiClientError(cause) && cause.status === 404) {
          setLoadState("needs_profile");
          return;
        }

        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری داشبورد ناموفق بود.",
        );
        setLoadState("ready");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  if (!user) return null;

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
    router.push(resolveAppNotificationHref(notification, "provider"));
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

  if (loadState === "loading") {
    return (
      <PageContainer withDock>
        <PageHeader
          title="داشبورد"
          description={`سلام ${user.displayName}، خوش آمدید`}
        />
        <div className="flex justify-center py-16">
          <LoaderCircle className="size-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer withDock>
      <PageHeader
        title="داشبورد"
        description={`سلام ${user.displayName}، خوش آمدید`}
      />

      {loadState === "needs_profile" ? (
        <Card className="mb-4 overflow-hidden border-primary/20 bg-primary/[0.04]">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">پروفایل خدمات‌دهنده تکمیل نشده</p>
              <p className="mt-1 text-sm text-muted-foreground">
                برای دریافت درخواست، ابتدا محدوده کاری و خدمات خود را تنظیم
                کنید.
              </p>
              <Button asChild size="sm" className="mt-3 rounded-xl">
                <Link href="/providers/services">تنظیم خدمات</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!hasSubscription && loadState === "ready" ? (
        <Card className="mb-4 overflow-hidden border-amber-200/80 bg-gradient-to-l from-amber-50 to-orange-50">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900">اشتراک فعال نیست</p>
              <p className="mt-1 text-sm text-amber-800/80">
                برای ارائه خدمات و دیده شدن در جستجو، اشتراک فعال کنید.
              </p>
              <Button asChild size="sm" className="mt-3 rounded-xl">
                <Link href="/providers/subscription">فعال‌سازی اشتراک</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {dashboard?.warnings.length ? (
        <Card className="mb-4 border-amber-200/80 bg-amber-50/60">
          <CardContent className="space-y-1 p-4 text-sm text-amber-900">
            {dashboard.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 animate-slide-up">
        <StatCard
          label="درخواست جدید"
          value={dashboard?.counts.newRequests ?? 0}
          icon={ClipboardList}
        />
        <StatCard
          label="در حال انجام"
          value={dashboard?.counts.inProgressRequests ?? 0}
          icon={Tractor}
        />
        <StatCard
          label="درآمد ماه"
          value={formatMonthlyRevenue(dashboard?.monthlyRevenueToman ?? 0)}
          icon={CircleDollarSign}
        />
        <StatCard
          label="خدمات فعال"
          value={activeServicesCount}
          icon={Wrench}
        />
      </div>

      <section className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            اعلان‌های اخیر
          </h2>
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
                      : "mt-1 size-2 shrink-0 rounded-full bg-destructive"
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

      <section className="grid gap-3">
        <Button asChild className="h-12 rounded-xl">
          <Link href="/providers/requests">مشاهده درخواست‌های جدید</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-xl">
          <Link href="/providers/services">مدیریت خدمات</Link>
        </Button>
      </section>
    </PageContainer>
  );
}
