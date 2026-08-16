import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

export async function listActiveSubscriptionPlans() {
  return prisma.subscriptionPlan.findMany({
    where: { deletedAt: null, isActive: 1 },
    orderBy: [{ sortOrder: "asc" }, { priceToman: "asc" }],
    select: {
      code: true,
      description: true,
      durationMonths: true,
      features: true,
      isRecommended: true,
      name: true,
      priceToman: true,
      sortOrder: true,
    },
  });
}

export async function findActivePlanByCode(code: string) {
  return prisma.subscriptionPlan.findFirst({
    where: { code, deletedAt: null, isActive: 1 },
    select: {
      code: true,
      durationMonths: true,
      id: true,
      name: true,
      priceToman: true,
    },
  });
}

export async function findProviderProfileIdByUserId(userId: bigint) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
}

export async function findProviderProfileByUserPublicId(publicId: string) {
  return prisma.providerProfile.findFirst({
    where: { user: { publicId, deletedAt: null } },
    select: {
      id: true,
      userId: true,
      user: { select: { publicId: true } },
    },
  });
}

export async function findActiveSubscriptionForProvider(
  providerProfileId: bigint,
  now: Date,
) {
  return prisma.providerSubscription.findFirst({
    where: {
      endsAt: { gt: now },
      providerProfileId,
      startsAt: { lte: now },
      status: "active",
    },
    select: {
      amountToman: true,
      endsAt: true,
      planNameSnapshot: true,
      publicId: true,
      source: true,
      startsAt: true,
      status: true,
    },
  });
}

export async function listProviderSubscriptions(input: {
  cursorId?: bigint;
  limit: number;
  providerProfileId: bigint;
}) {
  return prisma.providerSubscription.findMany({
    where: {
      providerProfileId: input.providerProfileId,
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      amountToman: true,
      cancelledAt: true,
      endsAt: true,
      id: true,
      planNameSnapshot: true,
      publicId: true,
      source: true,
      startsAt: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function findSubscriptionByPublicIdForProvider(
  providerProfileId: bigint,
  publicId: string,
) {
  return prisma.providerSubscription.findFirst({
    where: { providerProfileId, publicId },
    select: { id: true, publicId: true },
  });
}

export async function createPendingPurchase(
  transaction: TransactionClient,
  input: {
    amountToman: bigint;
    paymentPublicId: string;
    planId: bigint;
    planName: string;
    providerProfileId: bigint;
    subscriptionPublicId: string;
    userId: bigint;
  },
) {
  const subscription = await transaction.providerSubscription.create({
    data: {
      amountToman: input.amountToman,
      planNameSnapshot: input.planName,
      providerProfileId: input.providerProfileId,
      publicId: input.subscriptionPublicId,
      source: "purchase",
      status: "pending",
      subscriptionPlanId: input.planId,
    },
    select: { id: true, publicId: true },
  });

  const payment = await transaction.subscriptionPayment.create({
    data: {
      amountToman: input.amountToman,
      providerSubscriptionId: subscription.id,
      publicId: input.paymentPublicId,
      status: "initiated",
      userId: input.userId,
      gateway: "mock",
    },
    select: {
      amountToman: true,
      id: true,
      publicId: true,
      status: true,
    },
  });

  return { payment, subscription };
}

export async function markPaymentPendingWithAuthority(
  paymentId: bigint,
  authority: string,
) {
  return prisma.subscriptionPayment.update({
    where: { id: paymentId },
    data: {
      authority,
      status: "pending",
    },
    select: {
      amountToman: true,
      authority: true,
      id: true,
      publicId: true,
      status: true,
    },
  });
}

export async function markPaymentFailed(
  paymentId: bigint,
  now: Date,
  failureCode: string,
  failureMessage: string,
) {
  await prisma.subscriptionPayment.update({
    where: { id: paymentId },
    data: {
      failedAt: now,
      failureCode,
      failureMessage,
      status: "failed",
    },
  });
}

export async function findPaymentByPublicIdForUser(
  userId: bigint,
  publicId: string,
) {
  return prisma.subscriptionPayment.findFirst({
    where: { publicId, userId },
    select: {
      amountToman: true,
      authority: true,
      createdAt: true,
      failedAt: true,
      failureCode: true,
      failureMessage: true,
      gateway: true,
      id: true,
      paidAt: true,
      providerSubscriptionId: true,
      publicId: true,
      status: true,
      transactionReference: true,
      subscription: {
        select: {
          publicId: true,
          status: true,
        },
      },
    },
  });
}

export async function findPaymentByAuthority(
  gateway: string,
  authority: string,
) {
  return prisma.subscriptionPayment.findFirst({
    where: { authority, gateway },
    select: {
      amountToman: true,
      authority: true,
      id: true,
      providerSubscriptionId: true,
      publicId: true,
      status: true,
      transactionReference: true,
      userId: true,
    },
  });
}

export async function listUserPayments(input: {
  cursorId?: bigint;
  limit: number;
  userId: bigint;
}) {
  return prisma.subscriptionPayment.findMany({
    where: {
      userId: input.userId,
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      amountToman: true,
      createdAt: true,
      gateway: true,
      id: true,
      paidAt: true,
      publicId: true,
      status: true,
      subscription: { select: { publicId: true } },
    },
  });
}

export async function findPaymentActivationPreview(
  transaction: TransactionClient,
  paymentId: bigint,
) {
  const payment = await transaction.subscriptionPayment.findUnique({
    where: { id: paymentId },
    select: {
      providerSubscriptionId: true,
      subscription: { select: { providerProfileId: true } },
    },
  });
  if (!payment?.subscription) {
    return null;
  }
  return {
    providerProfileId: payment.subscription.providerProfileId,
    providerSubscriptionId: payment.providerSubscriptionId,
  };
}

export async function lockPaymentForActivation(
  transaction: TransactionClient,
  paymentId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      amountToman: bigint;
      authority: string | null;
      id: bigint;
      providerSubscriptionId: bigint | null;
      status: string;
      transactionReference: string | null;
    }>
  >`
    SELECT id,
           amount_toman AS amountToman,
           authority,
           provider_subscription_id AS providerSubscriptionId,
           status,
           transaction_reference AS transactionReference
    FROM subscription_payments
    WHERE id = ${paymentId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function lockSubscriptionForActivation(
  transaction: TransactionClient,
  subscriptionId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      id: bigint;
      providerProfileId: bigint;
      status: string;
      subscriptionPlanId: bigint;
    }>
  >`
    SELECT id,
           provider_profile_id AS providerProfileId,
           status,
           subscription_plan_id AS subscriptionPlanId
    FROM provider_subscriptions
    WHERE id = ${subscriptionId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function acquireProviderSubscriptionActivationLock(
  transaction: TransactionClient,
  providerProfileId: bigint,
): Promise<"acquired" | "busy"> {
  const lockName = `provider_sub_activate_${providerProfileId.toString()}`;
  const lockResult = await transaction.$queryRaw<
    Array<{ acquired: number | bigint | null }>
  >`
    SELECT GET_LOCK(${lockName}, 10) AS acquired
  `;
  return Number(lockResult[0]?.acquired ?? 0) === 1 ? "acquired" : "busy";
}

export async function releaseProviderSubscriptionActivationLock(
  transaction: TransactionClient,
  providerProfileId: bigint,
): Promise<void> {
  const lockName = `provider_sub_activate_${providerProfileId.toString()}`;
  await transaction.$executeRaw`SELECT RELEASE_LOCK(${lockName})`;
}

export async function lockProviderProfileForActivation(
  transaction: TransactionClient,
  providerProfileId: bigint,
): Promise<bigint | null> {
  await transaction.$executeRaw`
    UPDATE provider_profiles
    SET updated_at = CURRENT_TIMESTAMP(3)
    WHERE id = ${providerProfileId}
  `;
  const rows = await transaction.$queryRaw<Array<{ id: bigint }>>`
    SELECT id
    FROM provider_profiles
    WHERE id = ${providerProfileId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0]?.id ?? null;
}

export async function expireActiveSubscriptionsForProvider(
  transaction: TransactionClient,
  providerProfileId: bigint,
  now: Date,
): Promise<void> {
  await transaction.providerSubscription.updateMany({
    where: {
      providerProfileId,
      status: "active",
    },
    data: {
      status: "expired",
      updatedAt: now,
    },
  });
}

export async function activateSubscriptionAndPayment(
  transaction: TransactionClient,
  input: {
    durationMonths: number;
    now: Date;
    paymentId: bigint;
    providerProfileId: bigint;
    providerReference: string;
    subscriptionId: bigint;
  },
): Promise<{ endsAt: Date; startsAt: Date }> {
  const activeRows = await transaction.$queryRaw<
    Array<{ endsAt: Date | null; id: bigint }>
  >`
    SELECT id,
           ends_at AS endsAt
    FROM provider_subscriptions
    WHERE provider_profile_id = ${input.providerProfileId}
      AND status = 'active'
      AND id <> ${input.subscriptionId}
    FOR UPDATE
  `;

  let baseDate = input.now;
  for (const active of activeRows) {
    if (active.endsAt && active.endsAt > baseDate) {
      baseDate = active.endsAt;
    }
  }

  const startsAt = input.now;
  const endsAt = new Date(baseDate);
  endsAt.setUTCMonth(endsAt.getUTCMonth() + input.durationMonths);

  if (activeRows.length > 0) {
    await transaction.providerSubscription.updateMany({
      where: {
        id: { in: activeRows.map((row) => row.id) },
      },
      data: {
        status: "expired",
        updatedAt: input.now,
      },
    });
  }

  await transaction.providerSubscription.update({
    where: { id: input.subscriptionId },
    data: {
      activatedAt: input.now,
      endsAt,
      startsAt,
      status: "active",
    },
  });

  await transaction.subscriptionPayment.update({
    where: { id: input.paymentId },
    data: {
      paidAt: input.now,
      status: "paid",
      transactionReference: input.providerReference,
    },
  });

  return { endsAt, startsAt };
}

export async function cancelPendingSubscription(
  subscriptionId: bigint,
  now: Date,
  reason: string,
): Promise<void> {
  await prisma.providerSubscription.updateMany({
    where: {
      id: subscriptionId,
      status: "pending",
    },
    data: {
      cancellationReason: reason,
      cancelledAt: now,
      status: "cancelled",
    },
  });
}

export async function sumRefundedAmountToman(paymentId: bigint): Promise<bigint> {
  const result = await prisma.paymentRefund.aggregate({
    where: {
      status: { in: ["requested", "processing", "succeeded"] },
      subscriptionPaymentId: paymentId,
    },
    _sum: { amountToman: true },
  });
  return result._sum.amountToman ?? BigInt(0);
}


export async function getPlanDurationMonths(
  planId: bigint,
  transaction: TransactionClient = prisma,
): Promise<number> {
  const plan = await transaction.subscriptionPlan.findUniqueOrThrow({
    where: { id: planId },
    select: { durationMonths: true },
  });
  return plan.durationMonths;
}

export async function expireDueActiveSubscriptions(now: Date): Promise<number> {
  const result = await prisma.providerSubscription.updateMany({
    where: {
      endsAt: { lte: now },
      status: "active",
    },
    data: { status: "expired" },
  });
  return result.count;
}

export async function listStalePendingPayments(cutoff: Date) {
  return prisma.subscriptionPayment.findMany({
    where: {
      initiatedAt: { lt: cutoff },
      status: { in: ["initiated", "pending"] },
    },
    take: 100,
    select: {
      amountToman: true,
      authority: true,
      id: true,
      providerSubscriptionId: true,
      publicId: true,
      status: true,
    },
  });
}

export async function createGrantedSubscription(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    amountToman: bigint;
    durationMonths: number;
    now: Date;
    planId: bigint;
    planName: string;
    providerProfileId: bigint;
    publicId: string;
  },
) {
  const startsAt = input.now;
  const endsAt = new Date(input.now);
  endsAt.setUTCMonth(endsAt.getUTCMonth() + input.durationMonths);

  await expireActiveSubscriptionsForProvider(
    transaction,
    input.providerProfileId,
    input.now,
  );

  return transaction.providerSubscription.create({
    data: {
      activatedAt: input.now,
      amountToman: input.amountToman,
      endsAt,
      grantedByAdminId: input.adminId,
      planNameSnapshot: input.planName,
      providerProfileId: input.providerProfileId,
      publicId: input.publicId,
      source: "admin_grant",
      startsAt,
      status: "active",
      subscriptionPlanId: input.planId,
    },
    select: {
      endsAt: true,
      planNameSnapshot: true,
      publicId: true,
      startsAt: true,
      status: true,
    },
  });
}

export async function findSubscriptionByPublicId(publicId: string) {
  return prisma.providerSubscription.findUnique({
    where: { publicId },
    select: {
      id: true,
      providerProfileId: true,
      publicId: true,
      status: true,
    },
  });
}

export async function cancelSubscription(
  subscriptionId: bigint,
  now: Date,
  reason: string,
) {
  return prisma.providerSubscription.update({
    where: { id: subscriptionId },
    data: {
      cancellationReason: reason,
      cancelledAt: now,
      status: "cancelled",
    },
    select: {
      publicId: true,
      status: true,
    },
  });
}

export async function findPaymentByPublicId(publicId: string) {
  return prisma.subscriptionPayment.findUnique({
    where: { publicId },
    select: {
      amountToman: true,
      id: true,
      publicId: true,
      status: true,
      paymentRefunds: {
        where: { status: { in: ["requested", "processing", "succeeded"] } },
        select: { amountToman: true, status: true },
      },
    },
  });
}

export async function createRefund(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    amountToman: bigint;
    paymentId: bigint;
    reason: string;
  },
) {
  return transaction.paymentRefund.create({
    data: {
      amountToman: input.amountToman,
      reason: input.reason,
      requestedByAdminId: input.adminId,
      status: "requested",
      subscriptionPaymentId: input.paymentId,
    },
    select: {
      amountToman: true,
      createdAt: true,
      id: true,
      reason: true,
      status: true,
    },
  });
}

export async function processRefundSuccess(
  transaction: TransactionClient,
  input: {
    now: Date;
    paymentId: bigint;
    paymentStatus: "partially_refunded" | "refunded";
    refundId: bigint;
  },
) {
  await transaction.paymentRefund.update({
    where: { id: input.refundId },
    data: {
      processedAt: input.now,
      status: "succeeded",
      gatewayReference: `refund_${input.refundId.toString()}`,
    },
  });
  await transaction.subscriptionPayment.update({
    where: { id: input.paymentId },
    data: { status: input.paymentStatus },
  });
}
