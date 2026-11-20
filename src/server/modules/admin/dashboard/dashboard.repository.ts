import { prisma } from "@/server/db/prisma";

/** Iran has had no DST since 2022, so a fixed offset buckets days correctly. */
const TEHRAN_OFFSET = "+03:30";

const activeRestriction = (now: Date) => ({
  action: { in: ["ban" as const, "suspend" as const] },
  startsAt: { lte: now },
  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
});

export async function countUserMetrics(input: {
  dayStart: Date;
  now: Date;
  prevWeekStart: Date;
  weekStart: Date;
}) {
  const alive = { deletedAt: null };
  const [total, newToday, newWeek, newPrevWeek, activeWeek, providers, restricted, inactive] =
    await Promise.all([
      prisma.user.count({ where: alive }),
      prisma.user.count({ where: { ...alive, createdAt: { gte: input.dayStart } } }),
      prisma.user.count({ where: { ...alive, createdAt: { gte: input.weekStart } } }),
      prisma.user.count({
        where: { ...alive, createdAt: { gte: input.prevWeekStart, lt: input.weekStart } },
      }),
      prisma.user.count({ where: { ...alive, lastLoginAt: { gte: input.weekStart } } }),
      prisma.providerProfile.count({ where: { user: alive } }),
      prisma.user.count({
        where: { ...alive, userModerationActions: { some: activeRestriction(input.now) } },
      }),
      prisma.user.count({ where: { ...alive, isActive: 0 } }),
    ]);

  return { activeWeek, inactive, newPrevWeek, newToday, newWeek, providers, restricted, total };
}

export async function countRequestMetrics(input: {
  monthStart: Date;
  prevMonthStart: Date;
  staleBefore: Date;
}) {
  const [byStatus, newMonth, newPrevMonth, completedMonth, cancelledMonth, stale] = await Promise.all([
    prisma.serviceRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.serviceRequest.count({ where: { createdAt: { gte: input.monthStart } } }),
    prisma.serviceRequest.count({
      where: { createdAt: { gte: input.prevMonthStart, lt: input.monthStart } },
    }),
    prisma.serviceRequest.count({
      where: { completedAt: { gte: input.monthStart }, status: "completed" },
    }),
    prisma.serviceRequest.count({
      where: { cancelledAt: { gte: input.monthStart }, status: "cancelled" },
    }),
    prisma.serviceRequest.count({
      where: { createdAt: { lt: input.staleBefore }, status: "pending_provider" },
    }),
  ]);

  return {
    byStatus: byStatus.map((row) => ({ count: row._count._all, status: row.status })),
    cancelledMonth,
    completedMonth,
    newMonth,
    newPrevMonth,
    stale,
  };
}

export async function sumRevenueMetrics(input: {
  monthStart: Date;
  now: Date;
  prevMonthStart: Date;
  weekStart: Date;
}) {
  const paidStatuses = ["paid" as const, "partially_refunded" as const];
  const [paidMonth, paidPrevMonth, activeSubscriptions, failedWeek] = await Promise.all([
    prisma.subscriptionPayment.aggregate({
      _sum: { amountToman: true },
      where: { paidAt: { gte: input.monthStart }, status: { in: paidStatuses } },
    }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amountToman: true },
      where: {
        paidAt: { gte: input.prevMonthStart, lt: input.monthStart },
        status: { in: paidStatuses },
      },
    }),
    prisma.providerSubscription.count({
      where: { endsAt: { gt: input.now }, status: "active" },
    }),
    prisma.subscriptionPayment.count({
      where: { createdAt: { gte: input.weekStart }, status: "failed" },
    }),
  ]);

  return {
    activeSubscriptions,
    failedWeek,
    paidMonth: paidMonth._sum.amountToman ?? BigInt(0),
    paidPrevMonth: paidPrevMonth._sum.amountToman ?? BigInt(0),
  };
}

export async function countPendingProviders(): Promise<number> {
  return prisma.providerProfile.count({
    where: { approvedAt: null, isActive: 1, user: { deletedAt: null } },
  });
}

export async function sumLandMetrics() {
  const result = await prisma.land.aggregate({
    _count: { _all: true },
    _sum: { areaSquareMeters: true },
    where: { deletedAt: null },
  });
  return {
    total: result._count._all,
    totalAreaSquareMeters: Number(result._sum.areaSquareMeters ?? 0),
  };
}

interface DailyRow {
  day: string;
  value: bigint | number | string | null;
}

/** Daily buckets (Tehran calendar day) since `from`. */
export async function loadDailySeries(from: Date) {
  const [signups, requests, revenue] = await Promise.all([
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', ${TEHRAN_OFFSET}), '%Y-%m-%d') AS day,
             COUNT(*) AS value
      FROM users
      WHERE created_at >= ${from} AND deleted_at IS NULL
      GROUP BY day`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', ${TEHRAN_OFFSET}), '%Y-%m-%d') AS day,
             COUNT(*) AS value
      FROM service_requests
      WHERE created_at >= ${from}
      GROUP BY day`,
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE_FORMAT(CONVERT_TZ(paid_at, '+00:00', ${TEHRAN_OFFSET}), '%Y-%m-%d') AS day,
             COALESCE(SUM(amount_toman), 0) AS value
      FROM subscription_payments
      WHERE paid_at >= ${from} AND status IN ('paid', 'partially_refunded')
      GROUP BY day`,
  ]);

  const toMap = (rows: DailyRow[]) =>
    new Map(rows.map((row) => [row.day, Number(row.value ?? 0)]));

  return { requests: toMap(requests), revenue: toMap(revenue), signups: toMap(signups) };
}

export async function loadTopServices(from: Date, limit: number) {
  const rows = await prisma.serviceRequest.groupBy({
    by: ["serviceNameSnapshot", "serviceCategoryNameSnapshot"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
    where: { createdAt: { gte: from } },
  });
  return rows.map((row) => ({
    category: row.serviceCategoryNameSnapshot,
    count: row._count._all,
    name: row.serviceNameSnapshot,
  }));
}

export async function loadUsersByProvince(limit: number) {
  const rows = await prisma.user.groupBy({
    by: ["provinceId"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    where: { deletedAt: null },
  });
  const ids = rows.flatMap((row) => (row.provinceId === null ? [] : [row.provinceId]));
  const provinces = await prisma.province.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const names = new Map(provinces.map((province) => [province.id, province.name]));

  const known = rows
    .filter((row) => row.provinceId !== null)
    .map((row) => ({ count: row._count._all, name: names.get(row.provinceId!) ?? "نامشخص" }));
  const unknown = rows.find((row) => row.provinceId === null)?._count._all ?? 0;

  return { top: known.slice(0, limit), unknown };
}

export async function loadRecentUsers(limit: number) {
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { id: "desc" },
    take: limit,
    select: {
      createdAt: true,
      image: true,
      name: true,
      phone: true,
      providerProfile: { select: { id: true } },
      province: { select: { name: true } },
      publicId: true,
    },
  });
}

export async function loadRecentRequests(limit: number) {
  return prisma.serviceRequest.findMany({
    orderBy: { id: "desc" },
    take: limit,
    select: {
      agreedPriceToman: true,
      consumer: { select: { publicId: true } },
      consumerNameSnapshot: true,
      createdAt: true,
      publicId: true,
      serviceNameSnapshot: true,
      status: true,
    },
  });
}
