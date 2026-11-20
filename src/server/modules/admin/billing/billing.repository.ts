import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type {
  PaymentPeriod,
  PaymentsListQuery,
  SubscriptionsListQuery,
} from "@/server/modules/admin/billing/billing.schemas";

type Db = TransactionClient | typeof prisma;

const PUBLIC_ID = /^[0-9A-Za-z]{26}$/;

/**
 * Name, phone digits or a public id. Phone/public-id columns are ASCII, so
 * they are only compared when the query can match them (Persian text there is
 * a MySQL error, not a miss).
 */
function userSearch(q: string): Prisma.UserWhereInput[] {
  const or: Prisma.UserWhereInput[] = [{ name: { contains: q } }];
  const digits = q.replace(/\D/g, "");
  if (digits.length >= 3 && /^[\d\s+()-]+$/.test(q)) or.push({ phone: { contains: digits } });
  if (PUBLIC_ID.test(q)) or.push({ publicId: q.toUpperCase() });
  return or;
}

// ============================================================ subscriptions

function subscriptionFilters(query: Pick<SubscriptionsListQuery, "plan" | "q" | "source">): Prisma.ProviderSubscriptionWhereInput {
  const q = query.q?.trim();
  return {
    ...(query.plan ? { subscriptionPlanId: BigInt(query.plan) } : {}),
    ...(query.source !== "all" ? { source: query.source } : {}),
    ...(q
      ? {
          OR: [
            { providerProfile: { user: { OR: userSearch(q) } } },
            ...(PUBLIC_ID.test(q) ? [{ publicId: q.toUpperCase() }] : []),
          ],
        }
      : {}),
  };
}

export async function listSubscriptionRows(query: SubscriptionsListQuery) {
  const where: Prisma.ProviderSubscriptionWhereInput = {
    ...subscriptionFilters(query),
    ...(query.status !== "all" ? { status: query.status } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.providerSubscription.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        activatedAt: true,
        amountToman: true,
        cancellationReason: true,
        cancelledAt: true,
        createdAt: true,
        endsAt: true,
        grantedByAdmin: { select: { name: true } },
        id: true,
        plan: { select: { id: true, name: true } },
        planNameSnapshot: true,
        providerProfile: { select: { user: { select: { image: true, name: true, phone: true, publicId: true } } } },
        publicId: true,
        source: true,
        startsAt: true,
        status: true,
        subscriptionPayments: {
          orderBy: { id: "desc" },
          select: { publicId: true, status: true },
          take: 1,
        },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.providerSubscription.count({ where }),
  ]);
  return { rows, total };
}

export async function countSubscriptionsPerStatus(query: Pick<SubscriptionsListQuery, "plan" | "q" | "source">) {
  const rows = await prisma.providerSubscription.groupBy({
    _count: { _all: true },
    by: ["status"],
    where: subscriptionFilters(query),
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

export async function findSubscriptionByPublicId(db: Db, publicId: string) {
  return db.providerSubscription.findUnique({
    select: {
      endsAt: true,
      id: true,
      planNameSnapshot: true,
      providerProfile: { select: { id: true, userId: true } },
      providerProfileId: true,
      publicId: true,
      startsAt: true,
      status: true,
    },
    where: { publicId },
  });
}

export async function findProviderByUserPublicId(db: Db, userPublicId: string) {
  return db.user.findFirst({
    select: { deletedAt: true, id: true, name: true, providerProfile: { select: { id: true } } },
    where: { publicId: userPublicId },
  });
}

/** Providers for the grant picker, with their running subscription if any. */
export async function searchProviders(q: string | undefined, now: Date) {
  return prisma.user.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      image: true,
      name: true,
      phone: true,
      providerProfile: {
        select: {
          providerSubscriptions: {
            select: { endsAt: true, planNameSnapshot: true },
            take: 1,
            where: { endsAt: { gt: now }, status: "active" },
          },
        },
      },
      publicId: true,
    },
    take: 8,
    where: {
      deletedAt: null,
      providerProfile: { isNot: null },
      ...(q ? { OR: userSearch(q) } : {}),
    },
  });
}

export async function findActiveSubscriptionRow(db: Db, providerProfileId: bigint) {
  return db.providerSubscription.findFirst({
    select: { endsAt: true, id: true, planNameSnapshot: true, publicId: true },
    where: { providerProfileId, status: "active" },
  });
}

export async function expireSubscription(db: Db, id: bigint, now: Date) {
  await db.providerSubscription.update({ data: { status: "expired", updatedAt: now }, where: { id } });
}

export async function insertGrantedSubscription(
  db: Db,
  data: {
    adminId: bigint;
    endsAt: Date;
    now: Date;
    planId: bigint;
    planName: string;
    providerProfileId: bigint;
    publicId: string;
  },
) {
  return db.providerSubscription.create({
    data: {
      activatedAt: data.now,
      amountToman: BigInt(0),
      endsAt: data.endsAt,
      grantedByAdminId: data.adminId,
      planNameSnapshot: data.planName,
      providerProfileId: data.providerProfileId,
      publicId: data.publicId,
      source: "admin_grant",
      startsAt: data.now,
      status: "active",
      subscriptionPlanId: data.planId,
    },
    select: { endsAt: true, id: true, publicId: true, startsAt: true },
  });
}

export async function setSubscriptionEnd(db: Db, id: bigint, endsAt: Date, now: Date) {
  await db.providerSubscription.update({ data: { endsAt, updatedAt: now }, where: { id } });
}

export async function cancelSubscriptionRow(db: Db, id: bigint, input: { now: Date; reason: string }) {
  await db.providerSubscription.update({
    data: { cancellationReason: input.reason, cancelledAt: input.now, status: "cancelled", updatedAt: input.now },
    where: { id },
  });
}

/** An unpaid checkout of a cancelled subscription must not activate it later. */
export async function cancelOpenPaymentsOfSubscription(db: Db, subscriptionId: bigint, now: Date) {
  const result = await db.subscriptionPayment.updateMany({
    data: { cancelledAt: now, status: "cancelled", updatedAt: now },
    where: { providerSubscriptionId: subscriptionId, status: { in: ["initiated", "pending"] } },
  });
  return result.count;
}

// ==================================================================== plans

const PLAN_SELECT = {
  code: true,
  createdAt: true,
  description: true,
  durationMonths: true,
  features: true,
  id: true,
  isActive: true,
  isRecommended: true,
  name: true,
  priceToman: true,
  sortOrder: true,
  updatedAt: true,
} as const;

export async function listPlanRows() {
  return prisma.subscriptionPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: PLAN_SELECT,
    where: { deletedAt: null },
  });
}

export async function countSubscriptionsPerPlan(planIds: bigint[]) {
  if (planIds.length === 0) return [];
  return prisma.providerSubscription.groupBy({
    _count: { _all: true },
    by: ["subscriptionPlanId", "status"],
    where: { subscriptionPlanId: { in: planIds } },
  });
}

export async function sumRevenuePerPlan(planIds: bigint[]) {
  if (planIds.length === 0) return new Map<string, bigint>();
  const rows = await prisma.subscriptionPayment.findMany({
    select: { amountToman: true, paymentRefunds: { select: { amountToman: true }, where: { status: "succeeded" } }, subscription: { select: { subscriptionPlanId: true } } },
    where: { status: { in: ["paid", "partially_refunded", "refunded"] }, subscription: { subscriptionPlanId: { in: planIds } } },
  });
  const totals = new Map<string, bigint>();
  for (const row of rows) {
    const key = row.subscription?.subscriptionPlanId.toString();
    if (!key) continue;
    const refunded = row.paymentRefunds.reduce((sum, refund) => sum + refund.amountToman, BigInt(0));
    totals.set(key, (totals.get(key) ?? BigInt(0)) + row.amountToman - refunded);
  }
  return totals;
}

export async function findPlanById(db: Db, id: bigint) {
  return db.subscriptionPlan.findFirst({ select: PLAN_SELECT, where: { deletedAt: null, id } });
}

export async function findPlanIdByCode(db: Db, code: string) {
  return db.subscriptionPlan.findUnique({ select: { deletedAt: true, id: true }, where: { code } });
}

export async function nextPlanSortOrder(db: Db) {
  const row = await db.subscriptionPlan.aggregate({ _max: { sortOrder: true }, where: { deletedAt: null } });
  return Math.min(65_535, (row._max.sortOrder ?? 0) + 1);
}

export async function insertPlan(db: Db, data: Prisma.SubscriptionPlanUncheckedCreateInput) {
  return db.subscriptionPlan.create({ data, select: PLAN_SELECT });
}

export async function updatePlanRow(db: Db, id: bigint, data: Prisma.SubscriptionPlanUncheckedUpdateInput) {
  return db.subscriptionPlan.update({ data: { ...data, updatedAt: new Date() }, select: PLAN_SELECT, where: { id } });
}

export async function countOpenSubscriptionsForPlan(db: Db, planId: bigint) {
  return db.providerSubscription.count({ where: { status: { in: ["active", "pending"] }, subscriptionPlanId: planId } });
}

export async function listLivePlanIds(db: Db) {
  const rows = await db.subscriptionPlan.findMany({ select: { id: true }, where: { deletedAt: null } });
  return rows.map((row) => row.id);
}

export async function setPlanSortOrder(db: Db, id: bigint, sortOrder: number) {
  await db.subscriptionPlan.update({ data: { sortOrder }, where: { id } });
}

export async function listPlanOptions() {
  return prisma.subscriptionPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { durationMonths: true, id: true, isActive: true, name: true, priceToman: true },
    where: { deletedAt: null },
  });
}

// ================================================================= payments

const PAYMENT_STATUS_GROUPS: Record<Exclude<PaymentsListQuery["status"], "all">, Prisma.SubscriptionPaymentWhereInput["status"]> = {
  failed: { in: ["failed", "cancelled"] },
  open: { in: ["initiated", "pending"] },
  paid: "paid",
  refunds: { in: ["partially_refunded", "refunded"] },
};

const PERIOD_DAYS: Record<Exclude<PaymentPeriod, "all" | "today">, number> = { "30d": 30, "365d": 365, "7d": 7, "90d": 90 };

export function periodStart(period: PaymentPeriod, now: Date): Date | null {
  if (period === "all") return null;
  if (period === "today") {
    // Midnight in Tehran (UTC+03:30, no DST since 2022).
    const tehran = new Date(now.getTime() + 210 * 60_000);
    tehran.setUTCHours(0, 0, 0, 0);
    return new Date(tehran.getTime() - 210 * 60_000);
  }
  return new Date(now.getTime() - PERIOD_DAYS[period] * 86_400_000);
}

function paymentFilters(query: Pick<PaymentsListQuery, "period" | "q">, now: Date): Prisma.SubscriptionPaymentWhereInput {
  const q = query.q?.trim();
  const from = periodStart(query.period, now);
  const ascii = q ? /^[\x20-\x7e]+$/.test(q) : false;
  return {
    ...(from ? { initiatedAt: { gte: from } } : {}),
    ...(q
      ? {
          OR: [
            { user: { OR: userSearch(q) } },
            ...(PUBLIC_ID.test(q) ? [{ publicId: q.toUpperCase() }] : []),
            ...(ascii && q.length >= 4 ? [{ authority: q }, { transactionReference: q }] : []),
          ],
        }
      : {}),
  };
}

export async function listPaymentRows(query: PaymentsListQuery, now: Date) {
  const where: Prisma.SubscriptionPaymentWhereInput = {
    ...paymentFilters(query, now),
    ...(query.status !== "all" ? { status: PAYMENT_STATUS_GROUPS[query.status] } : {}),
  };
  const [rows, total, sums] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      orderBy: [{ initiatedAt: "desc" }, { id: "desc" }],
      select: {
        amountToman: true,
        failureMessage: true,
        gateway: true,
        initiatedAt: true,
        paidAt: true,
        paymentRefunds: { select: { amountToman: true }, where: { status: "succeeded" } },
        publicId: true,
        status: true,
        subscription: { select: { planNameSnapshot: true, publicId: true } },
        user: { select: { image: true, name: true, phone: true, publicId: true } },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.subscriptionPayment.count({ where }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amountToman: true },
      where: { ...paymentFilters(query, now), status: { in: ["paid", "partially_refunded", "refunded"] } },
    }),
  ]);
  return { collected: sums._sum.amountToman ?? BigInt(0), rows, total };
}

export async function sumRefundsInPeriod(query: Pick<PaymentsListQuery, "period" | "q">, now: Date) {
  const row = await prisma.paymentRefund.aggregate({
    _sum: { amountToman: true },
    where: { payment: paymentFilters(query, now), status: "succeeded" },
  });
  return row._sum.amountToman ?? BigInt(0);
}

export async function countPaymentsPerStatus(query: Pick<PaymentsListQuery, "period" | "q">, now: Date) {
  const rows = await prisma.subscriptionPayment.groupBy({
    _count: { _all: true },
    by: ["status"],
    where: paymentFilters(query, now),
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

export async function findPaymentDetail(publicId: string) {
  return prisma.subscriptionPayment.findUnique({
    select: {
      amountToman: true,
      authority: true,
      cancelledAt: true,
      createdAt: true,
      currency: true,
      failedAt: true,
      failureCode: true,
      failureMessage: true,
      gateway: true,
      gatewayPayload: true,
      id: true,
      initiatedAt: true,
      paidAt: true,
      paymentRefunds: {
        orderBy: { createdAt: "desc" },
        select: {
          amountToman: true,
          createdAt: true,
          gatewayReference: true,
          id: true,
          processedAt: true,
          reason: true,
          requestedByAdmin: { select: { name: true } },
          status: true,
        },
      },
      publicId: true,
      status: true,
      subscription: {
        select: {
          endsAt: true,
          planNameSnapshot: true,
          publicId: true,
          source: true,
          startsAt: true,
          status: true,
        },
      },
      transactionReference: true,
      updatedAt: true,
      user: { select: { image: true, name: true, phone: true, publicId: true } },
    },
    where: { publicId },
  });
}

export async function findPaymentForRefund(db: Db, publicId: string) {
  return db.subscriptionPayment.findUnique({
    select: {
      id: true,
      providerSubscriptionId: true,
      publicId: true,
      subscription: { select: { id: true, providerProfile: { select: { userId: true } }, status: true } },
    },
    where: { publicId },
  });
}

export async function sumSucceededRefunds(db: Db, paymentId: bigint) {
  const row = await db.paymentRefund.aggregate({
    _sum: { amountToman: true },
    where: { status: "succeeded", subscriptionPaymentId: paymentId },
  });
  return row._sum.amountToman ?? BigInt(0);
}

export async function insertManualRefund(
  db: Db,
  data: { adminId: bigint; amountToman: bigint; now: Date; paymentId: bigint; reason: string },
) {
  return db.paymentRefund.create({
    data: {
      amountToman: data.amountToman,
      gatewayPayload: { method: "manual", note: "Recorded by an admin; the gateway has no refund API." },
      processedAt: data.now,
      reason: data.reason,
      requestedByAdminId: data.adminId,
      status: "succeeded",
      subscriptionPaymentId: data.paymentId,
    },
    select: { id: true },
  });
}

export async function setPaymentStatus(db: Db, id: bigint, status: "refunded" | "partially_refunded", now: Date) {
  await db.subscriptionPayment.update({ data: { status, updatedAt: now }, where: { id } });
}
