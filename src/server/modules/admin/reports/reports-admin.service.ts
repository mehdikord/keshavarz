import {
  countActiveUsers,
  countUnmatchedRequests,
  countUsersBefore,
  completedTotals,
  dailyNewProviders,
  dailyNewUsers,
  dailyRequests,
  dailyRevenue,
  invitationResponseSeconds,
  invitationTotals,
  newUsersByProvince,
  providerActivityCounts,
  providerLeaderboard,
  requestDurations,
  requestStatusCounts,
  requestsByProvince,
  revenueBreakdown,
  revenueTotals,
  serviceBreakdown,
  subscriptionsOverlapping,
  type Bounds,
} from "@/server/modules/admin/reports/reports-admin.repository";
import {
  addDays,
  bucketize,
  bucketSlots,
  dayStart,
  median,
  rangeBounds,
  type BucketSlot,
  type ReportPeriod,
} from "@/server/modules/admin/reports/report-period";

/** A number for the selected period and the equal-length period before it. */
export interface Compared {
  current: number;
  /** `null` when the metric has no meaningful earlier value. */
  previous: number | null;
}

/** Same as `Compared` but either side may be missing (e.g. a median of nothing). */
export interface ComparedNullable {
  current: number | null;
  previous: number | null;
}

export interface SeriesPoint {
  /** First day of the bucket (ISO). */
  key: string;
  /** Last day of the bucket (ISO, inclusive). */
  last: string;
  values: Record<string, number>;
}

function buildSeries(slots: BucketSlot[], series: Record<string, number[]>): SeriesPoint[] {
  return slots.map((slot, index) => ({
    key: slot.key,
    last: slot.last,
    values: Object.fromEntries(Object.entries(series).map(([name, values]) => [name, values[index] ?? 0])),
  }));
}

const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);

// =================================================================== growth

export interface GrowthReport {
  kpis: {
    activeUsers: Compared;
    newProviders: Compared;
    newUsers: Compared;
    providerShare: Compared;
    totalUsers: Compared;
  };
  provinces: Array<{ name: string | null; providers: number; total: number }>;
  series: SeriesPoint[];
}

export async function getGrowthReport(period: ReportPeriod): Promise<GrowthReport> {
  const bounds = rangeBounds(period);
  const previous = rangeBounds(period.previous);
  const slots = bucketSlots(period);

  const [users, providers, before, beforePrev, active, activePrev, provinces, prevUsers, prevProviders] =
    await Promise.all([
      dailyNewUsers(bounds),
      dailyNewProviders(bounds),
      countUsersBefore(bounds.start),
      countUsersBefore(previous.start),
      countActiveUsers(bounds),
      countActiveUsers(previous),
      newUsersByProvince(bounds),
      dailyNewUsers(previous),
      dailyNewProviders(previous),
    ]);

  const newUsers = bucketize(slots, users);
  const newProviders = bucketize(slots, providers);
  let runningUsers = before.users;
  let runningProviders = before.providers;
  const totalUsers = newUsers.map((value) => (runningUsers += value));
  const totalProviders = newProviders.map((value) => (runningProviders += value));

  const sum = (map: Map<string, number>) => [...map.values()].reduce((total, value) => total + value, 0);
  const currentUsers = sum(users);
  const currentProviders = sum(providers);
  const previousUsers = sum(prevUsers);
  const previousProviders = sum(prevProviders);

  return {
    kpis: {
      activeUsers: { current: active, previous: activePrev },
      newProviders: { current: currentProviders, previous: previousProviders },
      newUsers: { current: currentUsers, previous: previousUsers },
      providerShare: {
        current: rate(runningProviders, runningUsers),
        previous: rate(beforePrev.providers + previousProviders, beforePrev.users + previousUsers),
      },
      totalUsers: { current: runningUsers, previous: before.users },
    },
    provinces,
    series: buildSeries(slots, { newProviders, newUsers, totalProviders, totalUsers }),
  };
}

// ============================================================== marketplace

export type RequestStatus = "awaiting_send" | "pending_provider" | "in_progress" | "completed" | "cancelled";

export interface ServiceRow {
  cancelled: number;
  categoryName: string;
  completed: number;
  created: number;
  gmv: number;
  id: string;
  image: string | null;
  isActive: boolean;
  name: string;
  supply: number;
  unmatched: number;
}

export interface MarketplaceReport {
  cancelledBy: Record<"admin" | "consumer" | "provider", number>;
  categories: Array<{ cancelled: number; completed: number; created: number; gmv: number; name: string; services: number }>;
  kpis: {
    averageOrder: Compared;
    cancellationRate: Compared;
    completed: Compared;
    completionRate: Compared;
    created: Compared;
    gmv: Compared;
    medianToAccept: ComparedNullable;
    medianToComplete: ComparedNullable;
    unmatched: Compared;
  };
  provinces: Array<{ completed: number; created: number; name: string | null }>;
  series: SeriesPoint[];
  services: ServiceRow[];
  statuses: Record<RequestStatus, number>;
}

async function marketplaceTotals(bounds: Bounds) {
  const [statusRows, completed, durations, unmatched] = await Promise.all([
    requestStatusCounts(bounds),
    completedTotals(bounds),
    requestDurations(bounds),
    countUnmatchedRequests(bounds),
  ]);
  const statuses: Record<RequestStatus, number> = {
    awaiting_send: 0,
    cancelled: 0,
    completed: 0,
    in_progress: 0,
    pending_provider: 0,
  };
  const cancelledBy = { admin: 0, consumer: 0, provider: 0 };
  for (const row of statusRows) {
    statuses[row.status as RequestStatus] += row.count;
    if (row.status === "cancelled" && row.cancelledBy) cancelledBy[row.cancelledBy] += row.count;
  }
  const created = Object.values(statuses).reduce((sum, value) => sum + value, 0);
  return {
    cancelledBy,
    completed,
    created,
    medianToAccept: median(durations.toAccept),
    medianToComplete: median(durations.toComplete),
    statuses,
    unmatched,
  };
}

export async function getMarketplaceReport(period: ReportPeriod): Promise<MarketplaceReport> {
  const bounds = rangeBounds(period);
  const slots = bucketSlots(period);
  const [current, previous, daily, services, provinces] = await Promise.all([
    marketplaceTotals(bounds),
    marketplaceTotals(rangeBounds(period.previous)),
    dailyRequests(bounds),
    serviceBreakdown(bounds),
    requestsByProvince(bounds),
  ]);

  const categories = new Map<string, MarketplaceReport["categories"][number]>();
  for (const service of services) {
    const entry = categories.get(service.categoryName) ?? {
      cancelled: 0,
      completed: 0,
      created: 0,
      gmv: 0,
      name: service.categoryName,
      services: 0,
    };
    entry.cancelled += service.cancelled;
    entry.completed += service.completed;
    entry.created += service.created;
    entry.gmv += service.gmv;
    entry.services += 1;
    categories.set(service.categoryName, entry);
  }

  const average = (totals: { gmv: number; jobs: number }) => (totals.jobs > 0 ? totals.gmv / totals.jobs : 0);

  return {
    cancelledBy: current.cancelledBy,
    categories: [...categories.values()].sort((a, b) => b.created - a.created || b.gmv - a.gmv),
    kpis: {
      averageOrder: { current: average(current.completed), previous: average(previous.completed) },
      cancellationRate: {
        current: rate(current.statuses.cancelled, current.created),
        previous: previous.created ? rate(previous.statuses.cancelled, previous.created) : null,
      },
      completed: { current: current.completed.jobs, previous: previous.completed.jobs },
      completionRate: {
        current: rate(current.statuses.completed, current.created),
        previous: previous.created ? rate(previous.statuses.completed, previous.created) : null,
      },
      created: { current: current.created, previous: previous.created },
      gmv: { current: current.completed.gmv, previous: previous.completed.gmv },
      medianToAccept: { current: current.medianToAccept, previous: previous.medianToAccept },
      medianToComplete: { current: current.medianToComplete, previous: previous.medianToComplete },
      unmatched: { current: current.unmatched, previous: previous.unmatched },
    },
    provinces,
    series: buildSeries(slots, {
      completed: bucketize(slots, daily.completed),
      created: bucketize(slots, daily.created),
      gmv: bucketize(slots, daily.gmv),
    }),
    services: services.sort((a, b) => b.created - a.created || b.gmv - a.gmv || a.name.localeCompare(b.name, "fa")),
    statuses: current.statuses,
  };
}

// ================================================================== revenue

export interface RevenueReport {
  kpis: {
    activeSubscriptions: Compared;
    adminGrants: Compared;
    averagePayment: Compared;
    failedPayments: Compared;
    gross: Compared;
    net: Compared;
    payments: Compared;
    refunds: Compared;
  };
  plans: Array<{ amount: number; firstAmount: number; name: string; payments: number; renewalAmount: number }>;
  refundCount: number;
  series: SeriesPoint[];
  sources: { adminGrants: number; promotions: number; purchases: number };
  split: { first: { amount: number; payments: number }; renewal: { amount: number; payments: number } };
}

/** Providers with a running subscription at instant `at` (one per provider). */
function activeAt(
  subscriptions: Array<{ cancelledAt: Date | null; endsAt: Date | null; providerProfileId: bigint; startsAt: Date | null }>,
  at: Date,
): number {
  const providers = new Set<string>();
  for (const row of subscriptions) {
    if (!row.startsAt || !row.endsAt) continue;
    if (row.startsAt > at || row.endsAt <= at) continue;
    if (row.cancelledAt && row.cancelledAt <= at) continue;
    providers.add(row.providerProfileId.toString());
  }
  return providers.size;
}

export async function getRevenueReport(period: ReportPeriod, now: Date): Promise<RevenueReport> {
  const bounds = rangeBounds(period);
  const previousBounds = rangeBounds(period.previous);
  const slots = bucketSlots(period);
  const [current, previous, daily, breakdown, overlapping] = await Promise.all([
    revenueTotals(bounds),
    revenueTotals(previousBounds),
    dailyRevenue(bounds),
    revenueBreakdown(bounds),
    subscriptionsOverlapping({ end: bounds.end, start: new Date(previousBounds.end.getTime() - 1) }),
  ]);

  // A bucket's value is the count at its last moment, but never later than now.
  const momentOf = (day: string) => {
    const end = dayStart(addDays(day, 1));
    return end > now ? now : new Date(end.getTime() - 1);
  };
  const activeSeries = slots.map((slot) => activeAt(overlapping, momentOf(slot.last)));
  const paid = bucketize(slots, daily.paid);
  const refunded = bucketize(slots, daily.refunded);

  const plans = new Map<string, RevenueReport["plans"][number]>();
  const split = { first: { amount: 0, payments: 0 }, renewal: { amount: 0, payments: 0 } };
  for (const row of breakdown) {
    const plan = plans.get(row.plan) ?? { amount: 0, firstAmount: 0, name: row.plan, payments: 0, renewalAmount: 0 };
    plan.amount += row.amount;
    plan.payments += row.payments;
    if (row.isRenewal) plan.renewalAmount += row.amount;
    else plan.firstAmount += row.amount;
    plans.set(row.plan, plan);
    const side = row.isRenewal ? split.renewal : split.first;
    side.amount += row.amount;
    side.payments += row.payments;
  }

  const average = (totals: { gross: number; payments: number }) => (totals.payments ? totals.gross / totals.payments : 0);

  return {
    kpis: {
      activeSubscriptions: {
        current: activeSeries.at(-1) ?? 0,
        previous: activeAt(overlapping, new Date(previousBounds.end.getTime() - 1)),
      },
      adminGrants: { current: current.adminGrants, previous: previous.adminGrants },
      averagePayment: { current: average(current), previous: average(previous) },
      failedPayments: { current: current.failedPayments, previous: previous.failedPayments },
      gross: { current: current.gross, previous: previous.gross },
      net: { current: current.gross - current.refunds, previous: previous.gross - previous.refunds },
      payments: { current: current.payments, previous: previous.payments },
      refunds: { current: current.refunds, previous: previous.refunds },
    },
    plans: [...plans.values()].sort((a, b) => b.amount - a.amount),
    refundCount: current.refundCount,
    series: buildSeries(slots, {
      activeSubscriptions: activeSeries,
      net: paid.map((value, index) => value - (refunded[index] ?? 0)),
      paid,
      refunded,
    }),
    sources: { adminGrants: current.adminGrants, promotions: current.promotions, purchases: current.purchases },
    split,
  };
}

// ================================================================ providers

export interface ProviderRow {
  accepted: number;
  acceptanceRate: number | null;
  gmv: number;
  id: string;
  image: string | null;
  jobs: number;
  name: string;
  phone: string;
  province: string | null;
  rejected: number;
  responseSeconds: number | null;
  sent: number;
}

export interface ProvidersReport {
  invitations: { accepted: number; rejected: number; removed: number; sent: number; waiting: number };
  kpis: {
    acceptanceRate: Compared;
    invitationsSent: Compared;
    invitedProviders: Compared;
    jobsPerProvider: Compared;
    medianResponse: ComparedNullable;
    workingProviders: Compared;
  };
  leaderboard: ProviderRow[];
}

async function providerTotals(bounds: Bounds) {
  const [invitations, responses, activity, jobs] = await Promise.all([
    invitationTotals(bounds),
    invitationResponseSeconds(bounds),
    providerActivityCounts(bounds),
    completedTotals(bounds),
  ]);
  const answered = invitations.accepted + invitations.rejected;
  return {
    acceptanceRate: answered ? rate(invitations.accepted, answered) : null,
    activity,
    invitations,
    jobsPerProvider: activity.working ? jobs.jobs / activity.working : 0,
    medianResponse: median(responses),
  };
}

export async function getProvidersReport(period: ReportPeriod, limit = 25): Promise<ProvidersReport> {
  const bounds = rangeBounds(period);
  const [current, previous, leaderboard] = await Promise.all([
    providerTotals(bounds),
    providerTotals(rangeBounds(period.previous)),
    providerLeaderboard(bounds, limit),
  ]);

  return {
    invitations: current.invitations,
    kpis: {
      acceptanceRate: { current: current.acceptanceRate ?? 0, previous: previous.acceptanceRate },
      invitationsSent: { current: current.invitations.sent, previous: previous.invitations.sent },
      invitedProviders: { current: current.activity.invited, previous: previous.activity.invited },
      jobsPerProvider: { current: current.jobsPerProvider, previous: previous.jobsPerProvider },
      medianResponse: { current: current.medianResponse, previous: previous.medianResponse },
      workingProviders: { current: current.activity.working, previous: previous.activity.working },
    },
    leaderboard: leaderboard.map((row) => {
      const answered = row.accepted + row.rejected;
      return { ...row, acceptanceRate: answered ? rate(row.accepted, answered) : null };
    }),
  };
}
