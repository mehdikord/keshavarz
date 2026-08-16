import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

export async function findOwnedLandIdByPublicId(
  userId: bigint,
  landPublicId: string,
) {
  return prisma.land.findFirst({
    where: { deletedAt: null, publicId: landPublicId, userId },
    select: { id: true, publicId: true, title: true },
  });
}

export async function findServiceIdBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { deletedAt: null, slug },
    select: { id: true, name: true, slug: true },
  });
}

export async function findProviderProfileIdByUserId(userId: bigint) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
}

function money(value: bigint | number | { toString(): string } | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === "bigint" || typeof value === "number") {
    return Number(value);
  }
  return Number(value.toString());
}

export async function sumConsumerCompletedCosts(input: {
  from: Date;
  landId?: bigint;
  to: Date;
  userId: bigint;
}) {
  const rows = await prisma.$queryRaw<
    Array<{ completed_count: bigint; total_cost: bigint | null }>
  >`
    SELECT
      COUNT(*) AS completed_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS total_cost
    FROM v_completed_service_request_financials v
    WHERE v.consumer_user_id = ${input.userId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.landId ? Prisma.sql`AND v.land_id = ${input.landId}` : Prisma.empty}
  `;
  const row = rows[0];
  return {
    completedCount: Number(row?.completed_count ?? 0),
    totalCostToman: money(row?.total_cost),
  };
}

export async function findConsumerTopService(input: {
  from: Date;
  landId?: bigint;
  to: Date;
  userId: bigint;
}) {
  const rows = await prisma.$queryRaw<
    Array<{
      service_name: string;
      service_slug: string;
      total_toman: bigint;
    }>
  >`
    SELECT
      s.slug AS service_slug,
      s.name AS service_name,
      SUM(v.agreed_price_toman) AS total_toman
    FROM v_completed_service_request_financials v
    INNER JOIN services s ON s.id = v.service_id
    WHERE v.consumer_user_id = ${input.userId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.landId ? Prisma.sql`AND v.land_id = ${input.landId}` : Prisma.empty}
    GROUP BY s.id, s.slug, s.name
    ORDER BY total_toman DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    name: row.service_name,
    serviceId: row.service_slug,
    totalToman: money(row.total_toman),
  };
}

export async function findConsumerTopLand(input: {
  from: Date;
  landId?: bigint;
  to: Date;
  userId: bigint;
}) {
  const rows = await prisma.$queryRaw<
    Array<{
      land_public_id: string;
      land_title: string;
      total_toman: bigint;
    }>
  >`
    SELECT
      l.public_id AS land_public_id,
      l.title AS land_title,
      SUM(v.agreed_price_toman) AS total_toman
    FROM v_completed_service_request_financials v
    INNER JOIN lands l ON l.id = v.land_id
    WHERE v.consumer_user_id = ${input.userId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.landId ? Prisma.sql`AND v.land_id = ${input.landId}` : Prisma.empty}
    GROUP BY l.id, l.public_id, l.title
    ORDER BY total_toman DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    landId: row.land_public_id,
    title: row.land_title,
    totalToman: money(row.total_toman),
  };
}

export async function listConsumerMonthlyCosts(input: {
  landId?: bigint;
  userId: bigint;
  year: number;
}) {
  const from = new Date(Date.UTC(input.year, 0, 1));
  const to = new Date(Date.UTC(input.year + 1, 0, 1));
  const rows = await prisma.$queryRaw<
    Array<{ month_num: number; row_count: bigint; total_toman: bigint }>
  >`
    SELECT
      MONTH(v.completed_at) AS month_num,
      COUNT(*) AS row_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS total_toman
    FROM v_completed_service_request_financials v
    WHERE v.consumer_user_id = ${input.userId}
      AND v.completed_at >= ${from}
      AND v.completed_at < ${to}
      ${input.landId ? Prisma.sql`AND v.land_id = ${input.landId}` : Prisma.empty}
    GROUP BY MONTH(v.completed_at)
    ORDER BY month_num ASC
  `;
  return rows.map((row) => ({
    count: Number(row.row_count),
    month: row.month_num,
    totalToman: money(row.total_toman),
  }));
}

export async function sumProviderCompletedRevenue(input: {
  from: Date;
  providerProfileId: bigint;
  serviceId?: bigint;
  to: Date;
}) {
  const rows = await prisma.$queryRaw<
    Array<{ completed_count: bigint; total_revenue: bigint | null }>
  >`
    SELECT
      COUNT(*) AS completed_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS total_revenue
    FROM v_completed_service_request_financials v
    WHERE v.assigned_provider_profile_id = ${input.providerProfileId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.serviceId ? Prisma.sql`AND v.service_id = ${input.serviceId}` : Prisma.empty}
  `;
  const row = rows[0];
  return {
    completedCount: Number(row?.completed_count ?? 0),
    totalRevenueToman: money(row?.total_revenue),
  };
}

export async function findProviderTopService(input: {
  from: Date;
  providerProfileId: bigint;
  serviceId?: bigint;
  to: Date;
}) {
  const rows = await prisma.$queryRaw<
    Array<{
      service_name: string;
      service_slug: string;
      total_toman: bigint;
    }>
  >`
    SELECT
      s.slug AS service_slug,
      s.name AS service_name,
      SUM(v.agreed_price_toman) AS total_toman
    FROM v_completed_service_request_financials v
    INNER JOIN services s ON s.id = v.service_id
    WHERE v.assigned_provider_profile_id = ${input.providerProfileId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.serviceId ? Prisma.sql`AND v.service_id = ${input.serviceId}` : Prisma.empty}
    GROUP BY s.id, s.slug, s.name
    ORDER BY total_toman DESC
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    name: row.service_name,
    serviceId: row.service_slug,
    totalToman: money(row.total_toman),
  };
}

export async function listProviderMonthlyRevenue(input: {
  from: Date;
  providerProfileId: bigint;
  serviceId?: bigint;
  to: Date;
}) {
  const rows = await prisma.$queryRaw<
    Array<{
      month_num: number;
      row_count: bigint;
      total_toman: bigint;
      year_num: number;
    }>
  >`
    SELECT
      YEAR(v.completed_at) AS year_num,
      MONTH(v.completed_at) AS month_num,
      COUNT(*) AS row_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS total_toman
    FROM v_completed_service_request_financials v
    WHERE v.assigned_provider_profile_id = ${input.providerProfileId}
      AND v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
      ${input.serviceId ? Prisma.sql`AND v.service_id = ${input.serviceId}` : Prisma.empty}
    GROUP BY YEAR(v.completed_at), MONTH(v.completed_at)
    ORDER BY year_num ASC, month_num ASC
  `;
  return rows.map((row) => ({
    count: Number(row.row_count),
    month: row.month_num,
    totalToman: money(row.total_toman),
    year: row.year_num,
  }));
}

export async function sumAdminGmv(input: { from: Date; to: Date }) {
  const rows = await prisma.$queryRaw<
    Array<{ completed_count: bigint; gmv: bigint | null }>
  >`
    SELECT
      COUNT(*) AS completed_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS gmv
    FROM v_completed_service_request_financials v
    WHERE v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
  `;
  const row = rows[0];
  return {
    completedCount: Number(row?.completed_count ?? 0),
    gmvToman: money(row?.gmv),
  };
}

export async function listAdminTopServicesByGmv(input: {
  from: Date;
  limit: number;
  to: Date;
}) {
  const rows = await prisma.$queryRaw<
    Array<{
      service_name: string;
      service_slug: string;
      total_toman: bigint;
    }>
  >`
    SELECT
      s.slug AS service_slug,
      s.name AS service_name,
      SUM(v.agreed_price_toman) AS total_toman
    FROM v_completed_service_request_financials v
    INNER JOIN services s ON s.id = v.service_id
    WHERE v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
    GROUP BY s.id, s.slug, s.name
    ORDER BY total_toman DESC
    LIMIT ${input.limit}
  `;
  return rows.map((row) => ({
    name: row.service_name,
    serviceId: row.service_slug,
    totalToman: money(row.total_toman),
  }));
}

export async function listAdminMonthlyGmv(input: { from: Date; to: Date }) {
  const rows = await prisma.$queryRaw<
    Array<{
      month_num: number;
      row_count: bigint;
      total_toman: bigint;
      year_num: number;
    }>
  >`
    SELECT
      YEAR(v.completed_at) AS year_num,
      MONTH(v.completed_at) AS month_num,
      COUNT(*) AS row_count,
      COALESCE(SUM(v.agreed_price_toman), 0) AS total_toman
    FROM v_completed_service_request_financials v
    WHERE v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
    GROUP BY YEAR(v.completed_at), MONTH(v.completed_at)
    ORDER BY year_num ASC, month_num ASC
  `;
  return rows.map((row) => ({
    count: Number(row.row_count),
    month: row.month_num,
    totalToman: money(row.total_toman),
    year: row.year_num,
  }));
}

export async function sumPaidSubscriptionRevenue(input: {
  from: Date;
  to: Date;
}) {
  const result = await prisma.subscriptionPayment.aggregate({
    where: {
      paidAt: { gte: input.from, lt: input.to },
      status: "paid",
    },
    _sum: { amountToman: true },
  });
  return money(result._sum.amountToman);
}

export async function sumSucceededRefunds(input: { from: Date; to: Date }) {
  const result = await prisma.paymentRefund.aggregate({
    where: {
      processedAt: { gte: input.from, lt: input.to },
      status: "succeeded",
    },
    _sum: { amountToman: true },
  });
  return money(result._sum.amountToman);
}

export async function sumFailedPayments(input: { from: Date; to: Date }) {
  const result = await prisma.subscriptionPayment.aggregate({
    where: {
      createdAt: { gte: input.from, lt: input.to },
      status: "failed",
    },
    _sum: { amountToman: true },
    _count: { _all: true },
  });
  return {
    amountToman: money(result._sum.amountToman),
    count: result._count._all,
  };
}

export async function countPaidPayments(input: { from: Date; to: Date }) {
  return prisma.subscriptionPayment.count({
    where: {
      paidAt: { gte: input.from, lt: input.to },
      status: "paid",
    },
  });
}

export async function countRequestsCreatedByStatus(input: {
  from: Date;
  to: Date;
}) {
  const rows = await prisma.serviceRequest.groupBy({
    by: ["status"],
    where: {
      createdAt: { gte: input.from, lt: input.to },
    },
    _count: { _all: true },
  });
  return Object.fromEntries(
    rows.map((row) => [row.status, row._count._all]),
  ) as Partial<
    Record<
      "pending_provider" | "in_progress" | "completed" | "cancelled",
      number
    >
  >;
}

export async function countActiveUsersInRange(input: {
  from: Date;
  to: Date;
}) {
  return prisma.user.count({
    where: {
      deletedAt: null,
      lastLoginAt: { gte: input.from, lt: input.to },
    },
  });
}

export async function countActiveApprovedProviders() {
  return prisma.providerProfile.count({
    where: {
      approvedAt: { not: null },
      isActive: 1,
      isAvailable: 1,
    },
  });
}

export async function countNotificationDeliveries(input: {
  from: Date;
  to: Date;
}) {
  const [total, failed] = await Promise.all([
    prisma.notificationDelivery.count({
      where: { updatedAt: { gte: input.from, lt: input.to } },
    }),
    prisma.notificationDelivery.count({
      where: {
        status: "failed",
        updatedAt: { gte: input.from, lt: input.to },
      },
    }),
  ]);
  return { failed, total };
}

export async function listCompletedFinancialsForExport(input: {
  from: Date;
  limit: number;
  to: Date;
}) {
  return prisma.$queryRaw<
    Array<{
      agreed_price_toman: bigint;
      completed_at: Date;
      consumer_user_id: bigint;
      land_id: bigint;
      provider_user_id: bigint;
      request_public_id: string;
      service_id: bigint;
    }>
  >`
    SELECT
      v.request_public_id,
      v.consumer_user_id,
      v.provider_user_id,
      v.agreed_price_toman,
      v.completed_at,
      v.service_id,
      v.land_id
    FROM v_completed_service_request_financials v
    WHERE v.completed_at >= ${input.from}
      AND v.completed_at < ${input.to}
    ORDER BY v.completed_at DESC
    LIMIT ${input.limit}
  `;
}
