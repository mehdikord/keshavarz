"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";

import { PageContainer } from "@/components/layout/page-container";
import { DashboardHero } from "@/components/providers-panel/dashboard/dashboard-hero";
import { IncomingRequests } from "@/components/providers-panel/dashboard/incoming-requests";
import { ReadinessCard } from "@/components/providers-panel/dashboard/readiness-card";
import { RecentNotifications } from "@/components/shared/recent-notifications";
import { StatGrid } from "@/components/providers-panel/dashboard/stat-grid";
import { SubscriptionCard } from "@/components/providers-panel/dashboard/subscription-card";
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
  patchAppProviderWorkArea,
  type AppProviderDashboard,
} from "@/lib/api/app-provider";
import {
  fetchProviderRequests,
  type AppProviderRequestSummary,
} from "@/lib/api/app-requests";
import {
  fetchAppProviderSubscription,
  isAppSubscriptionActive,
  type AppActiveSubscription,
} from "@/lib/api/app-subscriptions";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";

type DashboardLoadState = "loading" | "ready" | "needs_profile";

/** Everything is missing until the provider profile is created. */
const ALL_READINESS_KEYS = ["services", "workArea", "subscription", "availability", "active"];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function ProviderHomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);

  const [loadState, setLoadState] = useState<DashboardLoadState>("loading");
  const [dashboard, setDashboard] = useState<AppProviderDashboard | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeServicesCount, setActiveServicesCount] = useState(0);
  const [subscription, setSubscription] = useState<AppActiveSubscription | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [newRequests, setNewRequests] = useState<AppProviderRequestSummary[]>([]);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [markingAll, startMarkAll] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const [dash, services, activeSubscription, notificationsResult, requests] =
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
            fetchProviderRequests({
              linkStatus: "sent",
              limit: 20,
              signal: controller.signal,
            }),
          ]);

        if (cancelled) return;

        setDashboard(dash);
        setMissing(dash.warnings);
        setUnreadCount(dash.counts.unreadNotifications);
        setActiveServicesCount(
          services.items.filter((item) => item.isActive).length,
        );
        setSubscription(
          isAppSubscriptionActive(activeSubscription) ? activeSubscription : null,
        );
        setNotifications(notificationsResult.items.slice(0, 3));
        setNewRequests(
          requests.items
            .filter((item) => item.status === "pending_provider")
            .slice(0, 3),
        );
        setLoadState("ready");
      } catch (cause: unknown) {
        if (cancelled || controller.signal.aborted) return;

        if (isApiClientError(cause) && cause.status === 404) {
          setMissing(ALL_READINESS_KEYS);
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

  const loading = loadState === "loading";
  const hasProfile = loadState === "ready";
  const isAvailable = !missing.includes("availability");

  const setAvailability = async (next: boolean) => {
    setTogglingAvailability(true);
    try {
      const profile = await patchAppProviderWorkArea({ isAvailable: next });
      setMissing(profile.eligibility.missing);
      toast.success(next ? "آماده دریافت درخواست هستید" : "از دسترس خارج شدید");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "تغییر وضعیت ناموفق بود",
      );
    } finally {
      setTogglingAvailability(false);
    }
  };

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
        setUnreadCount(0);
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
    <MotionConfig reducedMotion="user">
      <PageContainer withDock className="px-0 pt-0">
        <DashboardHero
          name={user.displayName}
          avatarSrc={image}
          loading={loading}
          monthlyRevenue={dashboard?.monthlyRevenueToman ?? 0}
          unreadNotifications={unreadCount}
          isAvailable={hasProfile ? isAvailable : null}
          isSearchable={missing.length === 0}
          togglingAvailability={togglingAvailability}
          onToggleAvailability={() => void setAvailability(!isAvailable)}
        />

        <div className="relative z-10 -mt-4 flex flex-col gap-6 px-4">
          {!loading && missing.length > 0 ? (
            <Reveal>
              <ReadinessCard
                missing={missing}
                togglingAvailability={togglingAvailability}
                onEnableAvailability={
                  hasProfile ? () => void setAvailability(true) : undefined
                }
              />
            </Reveal>
          ) : null}

          <Reveal delay={0.08}>
            <StatGrid
              loading={loading}
              newRequests={dashboard?.counts.newRequests ?? 0}
              inProgress={dashboard?.counts.inProgressRequests ?? 0}
              activeServices={activeServicesCount}
            />
          </Reveal>

          {hasProfile || loading ? (
            <Reveal delay={0.16}>
              <IncomingRequests loading={loading} requests={newRequests} />
            </Reveal>
          ) : null}

          {subscription ? (
            <Reveal delay={0.22}>
              <SubscriptionCard subscription={subscription} />
            </Reveal>
          ) : null}

          {!loading ? (
            <Reveal delay={0.28}>
              <RecentNotifications
                notifications={notifications}
                markingAll={markingAll}
                onMarkAllRead={handleMarkAllRead}
                onOpen={(notification) => void handleNotificationClick(notification)}
              />
            </Reveal>
          ) : null}
        </div>
      </PageContainer>
    </MotionConfig>
  );
}
