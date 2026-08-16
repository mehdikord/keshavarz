import { systemClock } from "@/server/clock/clock";
import {
  getDashboardCache,
  setDashboardCache,
} from "@/server/modules/admin-dashboard/dashboard.cache";
import { DASHBOARD_TIMEZONE } from "@/server/modules/admin-dashboard/dashboard.schemas";
import {
  countActiveUsersInRange,
  countNotificationDeliveryFailures,
  countPaymentFailures,
  countProviders,
  countRequestsByStatus,
  countUsers,
  sumPaidSubscriptionRevenue,
} from "@/server/modules/admin-dashboard/dashboard.repository";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const REQUEST_STATUSES = [
  "pending_provider",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export interface AdminDashboardKpis {
  activeUsers: number;
  approvedProviders: number;
  availableProviders: number;
  from: string;
  notificationDeliveryFailuresCount: number;
  paymentFailuresCount: number;
  requestsByStatus: Record<(typeof REQUEST_STATUSES)[number], number>;
  subscriptionRevenuePaidToman: number;
  timezone: typeof DASHBOARD_TIMEZONE;
  to: string;
  totalProviders: number;
  totalUsers: number;
}

function resolveRange(input: { from?: string; to?: string }): {
  from: Date;
  to: Date;
} {
  const now = systemClock.now();
  const to = input.to ? new Date(input.to) : now;
  const from = input.from
    ? new Date(input.from)
    : new Date(to.getTime() - THIRTY_DAYS_MS);
  return { from, to };
}

export async function getAdminDashboard(input: {
  from?: string;
  to?: string;
}): Promise<AdminDashboardKpis> {
  const range = resolveRange(input);
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const cacheKey = `dashboard:${fromIso}:${toIso}`;

  const cached = getDashboardCache<AdminDashboardKpis>(cacheKey);
  if (cached) {
    return cached;
  }

  const [
    totalUsers,
    activeUsers,
    totalProviders,
    approvedProviders,
    availableProviders,
    requestGroups,
    revenue,
    paymentFailuresCount,
    notificationDeliveryFailuresCount,
  ] = await Promise.all([
    countUsers({ deletedAtNull: true }),
    countActiveUsersInRange(range),
    countProviders({}),
    countProviders({ approvedOnly: true }),
    countProviders({ availableOnly: true }),
    countRequestsByStatus(range),
    sumPaidSubscriptionRevenue(range),
    countPaymentFailures(range),
    countNotificationDeliveryFailures(range),
  ]);

  const requestsByStatus = Object.fromEntries(
    REQUEST_STATUSES.map((status) => [status, 0]),
  ) as Record<(typeof REQUEST_STATUSES)[number], number>;

  for (const row of requestGroups) {
    if (row.status in requestsByStatus) {
      requestsByStatus[row.status] = row._count._all;
    }
  }

  const result: AdminDashboardKpis = {
    activeUsers,
    approvedProviders,
    availableProviders,
    from: fromIso,
    notificationDeliveryFailuresCount,
    paymentFailuresCount,
    requestsByStatus,
    subscriptionRevenuePaidToman: Number(revenue),
    timezone: DASHBOARD_TIMEZONE,
    to: toIso,
    totalProviders,
    totalUsers,
  };

  setDashboardCache(cacheKey, result);
  return result;
}
