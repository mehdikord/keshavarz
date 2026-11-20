import { systemClock } from "@/server/clock/clock";
import {
  countPendingProviders,
  countRequestMetrics,
  countUserMetrics,
  loadDailySeries,
  loadRecentRequests,
  loadRecentUsers,
  loadTopServices,
  loadUsersByProvince,
  sumLandMetrics,
  sumRevenueMetrics,
} from "@/server/modules/admin/dashboard/dashboard.repository";

const DAY_MS = 86_400_000;
const TEHRAN_OFFSET_MS = 3.5 * 3_600_000;
const SERIES_DAYS = 30;

export type RequestStatus =
  | "awaiting_send"
  | "pending_provider"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface DashboardSeriesPoint {
  date: string;
  requests: number;
  revenue: number;
  signups: number;
}

export interface DashboardOverview {
  attention: {
    failedPaymentsWeek: number;
    pendingProviders: number;
    restrictedUsers: number;
    staleRequests: number;
  };
  generatedAt: string;
  lands: { total: number; totalAreaSquareMeters: number };
  provinces: { top: Array<{ count: number; name: string }>; unknown: number };
  recentRequests: Array<{
    agreedPriceToman: string | null;
    consumerId: string;
    consumerName: string;
    createdAt: string;
    id: string;
    serviceName: string;
    status: RequestStatus;
  }>;
  recentUsers: Array<{
    createdAt: string;
    id: string;
    image: string | null;
    isProvider: boolean;
    name: string;
    phone: string;
    province: string | null;
  }>;
  requests: {
    byStatus: Record<RequestStatus, number>;
    cancelledMonth: number;
    completedMonth: number;
    newMonth: number;
    newPrevMonth: number;
    open: number;
    total: number;
  };
  revenue: {
    activeSubscriptions: number;
    paidMonth: number;
    paidPrevMonth: number;
  };
  series: DashboardSeriesPoint[];
  topServices: Array<{ category: string; count: number; name: string }>;
  users: {
    activeWeek: number;
    inactive: number;
    newPrevWeek: number;
    newToday: number;
    newWeek: number;
    providers: number;
    total: number;
  };
}

/** UTC instant of 00:00 Tehran time, `daysAgo` days before today. */
function tehranDayStart(now: Date, daysAgo = 0): Date {
  const local = now.getTime() + TEHRAN_OFFSET_MS;
  const midnightLocal = Math.floor(local / DAY_MS) * DAY_MS;
  return new Date(midnightLocal - TEHRAN_OFFSET_MS - daysAgo * DAY_MS);
}

function tehranDayKey(instant: Date): string {
  return new Date(instant.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10);
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const now = systemClock.now();
  const dayStart = tehranDayStart(now);
  const weekStart = tehranDayStart(now, 6);
  const prevWeekStart = tehranDayStart(now, 13);
  const monthStart = tehranDayStart(now, SERIES_DAYS - 1);
  const prevMonthStart = tehranDayStart(now, SERIES_DAYS * 2 - 1);

  const [users, requests, revenue, pendingProviders, lands, daily, topServices, provinces, recentUsers, recentRequests] =
    await Promise.all([
      countUserMetrics({ dayStart, now, prevWeekStart, weekStart }),
      countRequestMetrics({
        monthStart,
        prevMonthStart,
        staleBefore: new Date(now.getTime() - 2 * DAY_MS),
      }),
      sumRevenueMetrics({ monthStart, now, prevMonthStart, weekStart }),
      countPendingProviders(),
      sumLandMetrics(),
      loadDailySeries(monthStart),
      loadTopServices(monthStart, 5),
      loadUsersByProvince(6),
      loadRecentUsers(6),
      loadRecentRequests(6),
    ]);

  const byStatus: Record<RequestStatus, number> = {
    awaiting_send: 0,
    cancelled: 0,
    completed: 0,
    in_progress: 0,
    pending_provider: 0,
  };
  for (const row of requests.byStatus) byStatus[row.status] = row.count;
  const totalRequests = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

  const series: DashboardSeriesPoint[] = [];
  for (let index = SERIES_DAYS - 1; index >= 0; index -= 1) {
    const key = tehranDayKey(tehranDayStart(now, index));
    series.push({
      date: key,
      requests: daily.requests.get(key) ?? 0,
      revenue: daily.revenue.get(key) ?? 0,
      signups: daily.signups.get(key) ?? 0,
    });
  }

  return {
    attention: {
      failedPaymentsWeek: revenue.failedWeek,
      pendingProviders,
      restrictedUsers: users.restricted,
      staleRequests: requests.stale,
    },
    generatedAt: now.toISOString(),
    lands,
    provinces,
    recentRequests: recentRequests.map((request) => ({
      agreedPriceToman: request.agreedPriceToman?.toString() ?? null,
      consumerId: request.consumer.publicId,
      consumerName: request.consumerNameSnapshot,
      createdAt: request.createdAt.toISOString(),
      id: request.publicId,
      serviceName: request.serviceNameSnapshot,
      status: request.status,
    })),
    recentUsers: recentUsers.map((user) => ({
      createdAt: user.createdAt.toISOString(),
      id: user.publicId,
      image: user.image,
      isProvider: user.providerProfile !== null,
      name: user.name,
      phone: user.phone,
      province: user.province?.name ?? null,
    })),
    requests: {
      byStatus,
      cancelledMonth: requests.cancelledMonth,
      completedMonth: requests.completedMonth,
      newMonth: requests.newMonth,
      newPrevMonth: requests.newPrevMonth,
      open: byStatus.awaiting_send + byStatus.pending_provider + byStatus.in_progress,
      total: totalRequests,
    },
    revenue: {
      activeSubscriptions: revenue.activeSubscriptions,
      paidMonth: Number(revenue.paidMonth),
      paidPrevMonth: Number(revenue.paidPrevMonth),
    },
    series,
    topServices,
    users: {
      activeWeek: users.activeWeek,
      inactive: users.inactive,
      newPrevWeek: users.newPrevWeek,
      newToday: users.newToday,
      newWeek: users.newWeek,
      providers: users.providers,
      total: users.total,
    },
  };
}
