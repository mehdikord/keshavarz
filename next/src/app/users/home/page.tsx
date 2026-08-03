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
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getConsumerMonthlyCost,
  getConsumerRequestsForTab,
} from "@/lib/utils/consumer-requests";
import { useAuthStore } from "@/stores/auth-store";
import { useConsumerStore } from "@/stores/consumer-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useRequestStore } from "@/stores/request-store";

export default function ConsumerHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const lands = useConsumerStore((state) => state.lands);
  const requests = useRequestStore((state) => state.requests);
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

  const consumerId = user.id;
  const userLands = lands.filter((land) => land.userId === consumerId);
  const pendingCount = getConsumerRequestsForTab(
    consumerId,
    "pending_provider",
    requests,
  ).length;
  const inProgressCount = getConsumerRequestsForTab(
    consumerId,
    "in_progress",
    requests,
  ).length;
  const monthlyCost = getConsumerMonthlyCost(consumerId, requests);

  return (
    <PageContainer withDock>
      <PageHeader
        title="داشبورد"
        description={`سلام ${user.displayName}، آماده جستجوی خدمات هستید؟`}
      />

      {userLands.length === 0 ? (
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
        <StatCard
          label="در حال انجام"
          value={inProgressCount}
          icon={Search}
        />
        <StatCard
          label="هزینه ماه"
          value={monthlyCost > 0 ? `${Math.round(monthlyCost / 1_000_000)}M` : "۰"}
          icon={Wallet}
        />
        <StatCard
          label="زمین‌های من"
          value={userLands.length}
          icon={MapPin}
        />
      </div>

      <section className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">اعلان‌های اخیر</h2>
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
                onClick={() => {
                  markRead(notification.id);
                  router.push("/users/requests");
                }}
                className="flex w-full items-start gap-3 rounded-2xl border border-border/70 bg-surface px-4 py-3 text-right transition-colors hover:bg-muted/40"
              >
                <span
                  className={
                    notification.read
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
