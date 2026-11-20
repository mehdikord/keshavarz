import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { TEHRAN_OFFSET } from "@/server/modules/admin/reports/report-period";

/** Half-open instant range `[start, end)`. */
export interface Bounds {
  end: Date;
  start: Date;
}

interface DailyRow {
  day: string;
  value: bigint | number | string | null;
}

const PAID = Prisma.sql`('paid', 'partially_refunded', 'refunded')`;

function tehranDay(column: Prisma.Sql) {
  return Prisma.sql`DATE_FORMAT(CONVERT_TZ(${column}, '+00:00', ${TEHRAN_OFFSET}), '%Y-%m-%d')`;
}

function toDailyMap(rows: DailyRow[]): Map<string, number> {
  return new Map(rows.map((row) => [row.day, Number(row.value ?? 0)]));
}

const num = (value: bigint | number | string | null | undefined) => Number(value ?? 0);

// =================================================================== growth

export async function dailyNewUsers(bounds: Bounds) {
  const rows = await prisma.$queryRaw<DailyRow[]>`
    SELECT ${tehranDay(Prisma.sql`created_at`)} AS day, COUNT(*) AS value
    FROM users
    WHERE created_at >= ${bounds.start} AND created_at < ${bounds.end} AND deleted_at IS NULL
    GROUP BY day`;
  return toDailyMap(rows);
}

export async function dailyNewProviders(bounds: Bounds) {
  const rows = await prisma.$queryRaw<DailyRow[]>`
    SELECT ${tehranDay(Prisma.sql`pp.created_at`)} AS day, COUNT(*) AS value
    FROM provider_profiles pp
    INNER JOIN users u ON u.id = pp.user_id AND u.deleted_at IS NULL
    WHERE pp.created_at >= ${bounds.start} AND pp.created_at < ${bounds.end}
    GROUP BY day`;
  return toDailyMap(rows);
}

export async function countUsersBefore(instant: Date) {
  const [users, providers] = await Promise.all([
    prisma.user.count({ where: { createdAt: { lt: instant }, deletedAt: null } }),
    prisma.providerProfile.count({ where: { createdAt: { lt: instant }, user: { deletedAt: null } } }),
  ]);
  return { providers, users };
}

/**
 * Users who used the app in the range: signed in (a session was created) or a
 * session was last active then, or their last login falls in it.
 */
export async function countActiveUsers(bounds: Bounds): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*) AS total
    FROM users u
    WHERE u.deleted_at IS NULL
      AND (
        (u.last_login_at >= ${bounds.start} AND u.last_login_at < ${bounds.end})
        OR EXISTS (
          SELECT 1 FROM user_sessions s
          WHERE s.user_id = u.id
            AND ((s.created_at >= ${bounds.start} AND s.created_at < ${bounds.end})
              OR (s.last_activity_at >= ${bounds.start} AND s.last_activity_at < ${bounds.end}))
        )
      )`;
  return num(rows[0]?.total);
}

export async function newUsersByProvince(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ name: string | null; providers: bigint; total: bigint }>>`
    SELECT p.name AS name, COUNT(*) AS total, COUNT(pp.id) AS providers
    FROM users u
    LEFT JOIN provinces p ON p.id = u.province_id
    LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.created_at >= ${bounds.start} AND u.created_at < ${bounds.end} AND u.deleted_at IS NULL
    GROUP BY p.name
    ORDER BY total DESC`;
  return rows.map((row) => ({ name: row.name, providers: num(row.providers), total: num(row.total) }));
}

// ============================================================== marketplace

export async function requestStatusCounts(bounds: Bounds) {
  const rows = await prisma.serviceRequest.groupBy({
    _count: { _all: true },
    by: ["status", "cancelledBy"],
    where: { createdAt: { gte: bounds.start, lt: bounds.end } },
  });
  return rows.map((row) => ({ cancelledBy: row.cancelledBy, count: row._count._all, status: row.status }));
}

export async function dailyRequests(bounds: Bounds) {
  const [created, completed, gmv] = await Promise.all([
    prisma.$queryRaw<DailyRow[]>`
      SELECT ${tehranDay(Prisma.sql`created_at`)} AS day, COUNT(*) AS value
      FROM service_requests
      WHERE created_at >= ${bounds.start} AND created_at < ${bounds.end}
      GROUP BY day`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT ${tehranDay(Prisma.sql`completed_at`)} AS day, COUNT(*) AS value
      FROM v_completed_service_request_financials
      WHERE completed_at >= ${bounds.start} AND completed_at < ${bounds.end}
      GROUP BY day`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT ${tehranDay(Prisma.sql`completed_at`)} AS day, COALESCE(SUM(agreed_price_toman), 0) AS value
      FROM v_completed_service_request_financials
      WHERE completed_at >= ${bounds.start} AND completed_at < ${bounds.end}
      GROUP BY day`,
  ]);
  return { completed: toDailyMap(completed), created: toDailyMap(created), gmv: toDailyMap(gmv) };
}

/** Completed work by completion time: the marketplace's money. */
export async function completedTotals(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ gmv: bigint | null; jobs: bigint }>>`
    SELECT COUNT(*) AS jobs, COALESCE(SUM(agreed_price_toman), 0) AS gmv
    FROM v_completed_service_request_financials
    WHERE completed_at >= ${bounds.start} AND completed_at < ${bounds.end}`;
  return { gmv: num(rows[0]?.gmv), jobs: num(rows[0]?.jobs) };
}

/** Seconds from creation to acceptance / completion, for requests created in the range. */
export async function requestDurations(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ toAccept: bigint | null; toComplete: bigint | null }>>`
    SELECT TIMESTAMPDIFF(SECOND, created_at, accepted_at) AS toAccept,
           TIMESTAMPDIFF(SECOND, created_at, completed_at) AS toComplete
    FROM service_requests
    WHERE created_at >= ${bounds.start} AND created_at < ${bounds.end}
      AND accepted_at IS NOT NULL
    LIMIT 50000`;
  return {
    toAccept: rows.flatMap((row) => (row.toAccept === null ? [] : [num(row.toAccept)])),
    toComplete: rows.flatMap((row) => (row.toComplete === null ? [] : [num(row.toComplete)])),
  };
}

/** Requests the search found nobody for and that were never sent to anyone. */
export async function countUnmatchedRequests(bounds: Bounds) {
  return prisma.serviceRequest.count({
    where: {
      createdAt: { gte: bounds.start, lt: bounds.end },
      serviceRequestCandidates: { none: {} },
      serviceRequestProviders: { none: {} },
    },
  });
}

/** Per-service demand, outcome and current supply. */
export async function serviceBreakdown(bounds: Bounds) {
  const rows = await prisma.$queryRaw<
    Array<{
      cancelled: bigint;
      categoryName: string;
      completed: bigint;
      created: bigint;
      gmv: bigint | null;
      image: string | null;
      isActive: number;
      serviceId: bigint;
      serviceName: string;
      supply: bigint;
      unmatched: bigint;
    }>
  >`
    SELECT s.id AS serviceId, s.name AS serviceName, s.image AS image, s.is_active AS isActive,
           c.name AS categoryName,
           COALESCE(d.created, 0) AS created,
           COALESCE(d.completed, 0) AS completed,
           COALESCE(d.cancelled, 0) AS cancelled,
           COALESCE(d.gmv, 0) AS gmv,
           COALESCE(d.unmatched, 0) AS unmatched,
           COALESCE(sp.supply, 0) AS supply
    FROM services s
    INNER JOIN service_categories c ON c.id = s.service_category_id
    LEFT JOIN (
      SELECT r.service_id,
             COUNT(*) AS created,
             SUM(r.status = 'completed') AS completed,
             SUM(r.status = 'cancelled') AS cancelled,
             SUM(CASE WHEN r.status = 'completed' THEN COALESCE(r.agreed_price_toman, 0) ELSE 0 END) AS gmv,
             SUM(NOT EXISTS (SELECT 1 FROM service_request_candidates rc WHERE rc.service_request_id = r.id)
                 AND NOT EXISTS (SELECT 1 FROM service_request_providers rp WHERE rp.service_request_id = r.id)) AS unmatched
      FROM service_requests r
      WHERE r.created_at >= ${bounds.start} AND r.created_at < ${bounds.end}
      GROUP BY r.service_id
    ) d ON d.service_id = s.id
    LEFT JOIN (
      SELECT ps.service_id, COUNT(*) AS supply
      FROM provider_services ps
      INNER JOIN provider_profiles pp ON pp.id = ps.provider_profile_id AND pp.is_active = 1
      INNER JOIN users u ON u.id = pp.user_id AND u.deleted_at IS NULL
      WHERE ps.is_active = 1
      GROUP BY ps.service_id
    ) sp ON sp.service_id = s.id
    WHERE s.deleted_at IS NULL OR d.created IS NOT NULL`;
  return rows.map((row) => ({
    cancelled: num(row.cancelled),
    categoryName: row.categoryName,
    completed: num(row.completed),
    created: num(row.created),
    gmv: num(row.gmv),
    id: row.serviceId.toString(),
    image: row.image,
    isActive: Number(row.isActive) === 1,
    name: row.serviceName,
    supply: num(row.supply),
    unmatched: num(row.unmatched),
  }));
}

/** Demand by the consumer's province. */
export async function requestsByProvince(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ completed: bigint; created: bigint; name: string | null }>>`
    SELECT p.name AS name, COUNT(*) AS created, SUM(r.status = 'completed') AS completed
    FROM service_requests r
    INNER JOIN users u ON u.id = r.consumer_user_id
    LEFT JOIN provinces p ON p.id = u.province_id
    WHERE r.created_at >= ${bounds.start} AND r.created_at < ${bounds.end}
    GROUP BY p.name
    ORDER BY created DESC`;
  return rows.map((row) => ({ completed: num(row.completed), created: num(row.created), name: row.name }));
}

// ================================================================== revenue

export async function dailyRevenue(bounds: Bounds) {
  const [paid, refunded] = await Promise.all([
    prisma.$queryRaw<DailyRow[]>`
      SELECT ${tehranDay(Prisma.sql`paid_at`)} AS day, COALESCE(SUM(amount_toman), 0) AS value
      FROM subscription_payments
      WHERE paid_at >= ${bounds.start} AND paid_at < ${bounds.end} AND status IN ${PAID}
      GROUP BY day`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT ${tehranDay(Prisma.sql`processed_at`)} AS day, COALESCE(SUM(amount_toman), 0) AS value
      FROM payment_refunds
      WHERE processed_at >= ${bounds.start} AND processed_at < ${bounds.end} AND status = 'succeeded'
      GROUP BY day`,
  ]);
  return { paid: toDailyMap(paid), refunded: toDailyMap(refunded) };
}

/**
 * Paid payments in the range, split by plan and by whether the payer had paid
 * before (a renewal) or not (a first purchase).
 */
export async function revenueBreakdown(bounds: Bounds) {
  const rows = await prisma.$queryRaw<
    Array<{ amount: bigint | null; isRenewal: bigint | number; payments: bigint; plan: string | null }>
  >`
    SELECT COALESCE(ps.plan_name_snapshot, 'بدون اشتراک') AS plan,
           EXISTS (
             SELECT 1 FROM subscription_payments prev
             WHERE prev.user_id = sp.user_id AND prev.status IN ${PAID} AND prev.paid_at < sp.paid_at
           ) AS isRenewal,
           COUNT(*) AS payments,
           COALESCE(SUM(sp.amount_toman), 0) AS amount
    FROM subscription_payments sp
    LEFT JOIN provider_subscriptions ps ON ps.id = sp.provider_subscription_id
    WHERE sp.paid_at >= ${bounds.start} AND sp.paid_at < ${bounds.end} AND sp.status IN ${PAID}
    GROUP BY plan, isRenewal`;
  return rows.map((row) => ({
    amount: num(row.amount),
    isRenewal: Number(row.isRenewal) === 1,
    payments: num(row.payments),
    plan: row.plan ?? "بدون اشتراک",
  }));
}

export async function revenueTotals(bounds: Bounds) {
  const [paid, refunds, failed, grants] = await Promise.all([
    prisma.subscriptionPayment.aggregate({
      _count: { _all: true },
      _sum: { amountToman: true },
      where: { paidAt: { gte: bounds.start, lt: bounds.end }, status: { in: ["paid", "partially_refunded", "refunded"] } },
    }),
    prisma.paymentRefund.aggregate({
      _count: { _all: true },
      _sum: { amountToman: true },
      where: { processedAt: { gte: bounds.start, lt: bounds.end }, status: "succeeded" },
    }),
    prisma.subscriptionPayment.count({ where: { createdAt: { gte: bounds.start, lt: bounds.end }, status: "failed" } }),
    prisma.providerSubscription.groupBy({
      _count: { _all: true },
      by: ["source"],
      where: { createdAt: { gte: bounds.start, lt: bounds.end }, status: { not: "pending" } },
    }),
  ]);
  const bySource = (source: string) => grants.find((row) => row.source === source)?._count._all ?? 0;
  return {
    adminGrants: bySource("admin_grant"),
    failedPayments: failed,
    gross: num(paid._sum.amountToman),
    payments: paid._count._all,
    promotions: bySource("promotion"),
    purchases: bySource("purchase"),
    refundCount: refunds._count._all,
    refunds: num(refunds._sum.amountToman),
  };
}

/** Subscriptions that overlap the range, to count how many were running at each bucket end. */
export async function subscriptionsOverlapping(bounds: Bounds) {
  return prisma.providerSubscription.findMany({
    select: { cancelledAt: true, endsAt: true, providerProfileId: true, startsAt: true },
    where: {
      endsAt: { gt: bounds.start },
      startsAt: { lt: bounds.end },
      status: { in: ["active", "expired", "cancelled"] },
    },
  });
}

// ================================================================ providers

export async function invitationTotals(bounds: Bounds) {
  const rows = await prisma.serviceRequestProvider.groupBy({
    _count: { _all: true },
    by: ["status"],
    where: { sentAt: { gte: bounds.start, lt: bounds.end } },
  });
  const count = (status: string) => rows.find((row) => row.status === status)?._count._all ?? 0;
  return {
    accepted: count("accepted"),
    rejected: count("rejected"),
    removed: count("removed"),
    sent: rows.reduce((sum, row) => sum + row._count._all, 0),
    waiting: count("sent"),
  };
}

/** Seconds from an invitation being sent to the provider's answer. */
export async function invitationResponseSeconds(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ seconds: bigint }>>`
    SELECT TIMESTAMPDIFF(SECOND, sent_at, responded_at) AS seconds
    FROM service_request_providers
    WHERE sent_at >= ${bounds.start} AND sent_at < ${bounds.end} AND responded_at IS NOT NULL
    LIMIT 50000`;
  return rows.map((row) => num(row.seconds));
}

export async function providerLeaderboard(bounds: Bounds, limit: number) {
  const rows = await prisma.$queryRaw<
    Array<{
      accepted: bigint;
      gmv: bigint | null;
      image: string | null;
      jobs: bigint;
      name: string;
      phone: string;
      provinceName: string | null;
      publicId: string;
      rejected: bigint;
      responseSeconds: number | string | null;
      sent: bigint;
    }>
  >`
    SELECT u.public_id AS publicId, u.name AS name, u.phone AS phone, u.image AS image, p.name AS provinceName,
           COALESCE(j.jobs, 0) AS jobs, COALESCE(j.gmv, 0) AS gmv,
           COALESCE(i.sent, 0) AS sent, COALESCE(i.accepted, 0) AS accepted, COALESCE(i.rejected, 0) AS rejected,
           i.responseSeconds AS responseSeconds
    FROM provider_profiles pp
    INNER JOIN users u ON u.id = pp.user_id
    LEFT JOIN provinces p ON p.id = u.province_id
    LEFT JOIN (
      SELECT assigned_provider_profile_id AS profileId, COUNT(*) AS jobs, SUM(agreed_price_toman) AS gmv
      FROM v_completed_service_request_financials
      WHERE completed_at >= ${bounds.start} AND completed_at < ${bounds.end}
      GROUP BY assigned_provider_profile_id
    ) j ON j.profileId = pp.id
    LEFT JOIN (
      SELECT provider_profile_id AS profileId,
             COUNT(*) AS sent,
             SUM(status = 'accepted') AS accepted,
             SUM(status = 'rejected') AS rejected,
             AVG(CASE WHEN responded_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, sent_at, responded_at) END) AS responseSeconds
      FROM service_request_providers
      WHERE sent_at >= ${bounds.start} AND sent_at < ${bounds.end}
      GROUP BY provider_profile_id
    ) i ON i.profileId = pp.id
    WHERE j.jobs IS NOT NULL OR i.sent IS NOT NULL
    ORDER BY jobs DESC, gmv DESC, sent DESC
    LIMIT ${limit}`;
  return rows.map((row) => ({
    accepted: num(row.accepted),
    gmv: num(row.gmv),
    id: row.publicId,
    image: row.image,
    jobs: num(row.jobs),
    name: row.name,
    phone: row.phone,
    province: row.provinceName,
    rejected: num(row.rejected),
    responseSeconds: row.responseSeconds === null ? null : Number(row.responseSeconds),
    sent: num(row.sent),
  }));
}

/** Providers with at least one completed job, and with at least one invitation, in the range. */
export async function providerActivityCounts(bounds: Bounds) {
  const rows = await prisma.$queryRaw<Array<{ invited: bigint; working: bigint }>>`
    SELECT
      (SELECT COUNT(DISTINCT assigned_provider_profile_id) FROM v_completed_service_request_financials
        WHERE completed_at >= ${bounds.start} AND completed_at < ${bounds.end}) AS working,
      (SELECT COUNT(DISTINCT provider_profile_id) FROM service_request_providers
        WHERE sent_at >= ${bounds.start} AND sent_at < ${bounds.end}) AS invited`;
  return { invited: num(rows[0]?.invited), working: num(rows[0]?.working) };
}
