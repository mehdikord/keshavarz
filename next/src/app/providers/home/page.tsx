"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CircleDollarSign,
  ClipboardList,
  Tractor,
  Wrench,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  countNewProviderRequests,
  getProviderMonthlyIncome,
} from "@/lib/utils/provider-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import {
  hasActiveSubscription,
  useProviderStore,
} from "@/stores/provider-store";
import { useRequestStore } from "@/stores/request-store";

export default function ProviderHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const requests = useRequestStore((state) => state.requests);
  const requestProviders = useRequestStore((state) => state.requestProviders);
  const offeredServices = useProviderStore((state) => state.offeredServices);
  const subscription = useProviderStore((state) => state.subscription);
  const allNotifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const notifications = useMemo(() => {
    if (!user) return [];
    return allNotifications
      .filter((notification) => notification.userId === user.id)
      .slice(0, 3);
  }, [allNotifications, user]);

  if (!user) return null;

  const providerId = user.id;
  const newCount = countNewProviderRequests(
    providerId,
    requests,
    requestProviders,
  );
  const inProgressCount = requests.filter(
    (request) =>
      request.status === "in_progress" &&
      request.assignedProviderId === providerId,
  ).length;
  const monthlyIncome = getProviderMonthlyIncome(providerId, requests);
  const hasSubscription = hasActiveSubscription(subscription);

  const handleNotificationClick = (notificationId: string) => {
    markRead(notificationId);
    router.push("/providers/requests");
  };

  return (
    <PageContainer withDock>
      <PageHeader
        title="داشبورد"
        description={`سلام ${user.displayName}، خوش آمدید`}
      />

      {!hasSubscription ? (
        <Card className="mb-4 overflow-hidden border-amber-200/80 bg-gradient-to-l from-amber-50 to-orange-50">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900">
                اشتراک فعال نیست
              </p>
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

      <div className="mb-5 grid grid-cols-2 gap-3 animate-slide-up">
        <StatCard
          label="درخواست جدید"
          value={newCount}
          icon={ClipboardList}
        />
        <StatCard
          label="در حال انجام"
          value={inProgressCount}
          icon={Tractor}
        />
        <StatCard
          label="درآمد ماه"
          value={monthlyIncome > 0 ? `${(monthlyIncome / 1_000_000).toFixed(1)}M` : "۰"}
          icon={CircleDollarSign}
        />
        <StatCard
          label="خدمات فعال"
          value={offeredServices.length}
          icon={Wrench}
        />
      </div>

      <section className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            اعلان‌های اخیر
          </h2>
          <div className="flex items-center gap-2">
            {notifications.some((item) => !item.read) ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => user && markAllRead(user.id)}
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
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification.id)}
                className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 text-right transition-colors hover:bg-muted/40"
              >
                <span
                  className={
                    notification.read
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
