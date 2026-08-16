import type { Prisma } from "@/generated/prisma/client";
import { Prisma as PrismaNamespace } from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

const planSelect = {
  code: true,
  createdAt: true,
  deletedAt: true,
  description: true,
  durationMonths: true,
  features: true,
  isActive: true,
  isRecommended: true,
  name: true,
  priceToman: true,
  sortOrder: true,
  updatedAt: true,
} as const;

function toPlanFeatures(
  features: unknown,
): Prisma.InputJsonValue | typeof PrismaNamespace.DbNull | undefined {
  if (features === undefined) {
    return undefined;
  }
  if (features === null) {
    return PrismaNamespace.DbNull;
  }
  return features as Prisma.InputJsonValue;
}

export async function listAdminSubscriptionPlans(input: {
  includeDeleted: boolean;
  isActive?: 0 | 1;
}) {
  return prisma.subscriptionPlan.findMany({
    where: {
      ...(input.includeDeleted ? {} : { deletedAt: null }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
    orderBy: [{ sortOrder: "asc" }, { priceToman: "asc" }, { id: "asc" }],
    select: planSelect,
  });
}

export async function findPlanByCode(code: string) {
  return prisma.subscriptionPlan.findUnique({
    where: { code },
    select: {
      ...planSelect,
      id: true,
    },
  });
}

export async function createSubscriptionPlan(input: {
  adminId: bigint;
  code: string;
  description?: string | null;
  durationMonths: number;
  features?: unknown;
  isActive: boolean;
  isRecommended: boolean;
  name: string;
  now: Date;
  priceToman: bigint;
  sortOrder: number;
}) {
  return prisma.subscriptionPlan.create({
    data: {
      code: input.code,
      createdAt: input.now,
      createdByAdminId: input.adminId,
      description: input.description ?? null,
      durationMonths: input.durationMonths,
      features: toPlanFeatures(input.features),
      isActive: input.isActive ? 1 : 0,
      isRecommended: input.isRecommended ? 1 : 0,
      name: input.name,
      priceToman: input.priceToman,
      sortOrder: input.sortOrder,
      updatedAt: input.now,
      updatedByAdminId: input.adminId,
    },
    select: planSelect,
  });
}

export async function updateSubscriptionPlan(
  planId: bigint,
  input: {
    adminId: bigint;
    description?: string | null;
    durationMonths?: number;
    features?: unknown;
    isActive?: boolean;
    isRecommended?: boolean;
    name?: string;
    now: Date;
    priceToman?: bigint;
    sortOrder?: number;
  },
) {
  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.durationMonths !== undefined
        ? { durationMonths: input.durationMonths }
        : {}),
      ...(input.features !== undefined
        ? { features: toPlanFeatures(input.features) }
        : {}),
      ...(input.isActive !== undefined
        ? { isActive: input.isActive ? 1 : 0 }
        : {}),
      ...(input.isRecommended !== undefined
        ? { isRecommended: input.isRecommended ? 1 : 0 }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.priceToman !== undefined
        ? { priceToman: input.priceToman }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: input.now,
      updatedByAdminId: input.adminId,
    },
    select: planSelect,
  });
}

export async function countActiveSubscriptionsForPlan(planId: bigint) {
  return prisma.providerSubscription.count({
    where: {
      status: "active",
      subscriptionPlanId: planId,
    },
  });
}

export async function softDeleteSubscriptionPlan(
  planId: bigint,
  input: { adminId: bigint; now: Date },
) {
  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      deletedAt: input.now,
      isActive: 0,
      updatedAt: input.now,
      updatedByAdminId: input.adminId,
    },
    select: planSelect,
  });
}

export async function findUserIdByPublicId(publicId: string) {
  return prisma.user.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function findProviderProfileIdByUserPublicId(publicId: string) {
  return prisma.providerProfile.findFirst({
    where: { user: { publicId, deletedAt: null } },
    select: { id: true },
  });
}

export async function findSubscriptionCursorByPublicId(publicId: string) {
  return prisma.providerSubscription.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function listAdminProviderSubscriptions(input: {
  cursorId?: bigint;
  limit: number;
  providerProfileId?: bigint;
  status?: "pending" | "active" | "expired" | "cancelled";
}) {
  return prisma.providerSubscription.findMany({
    where: {
      ...(input.providerProfileId
        ? { providerProfileId: input.providerProfileId }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      amountToman: true,
      cancelledAt: true,
      createdAt: true,
      endsAt: true,
      id: true,
      planNameSnapshot: true,
      publicId: true,
      source: true,
      startsAt: true,
      status: true,
      plan: { select: { code: true } },
      providerProfile: {
        select: { user: { select: { publicId: true } } },
      },
    },
  });
}

export async function findPaymentCursorByPublicId(publicId: string) {
  return prisma.subscriptionPayment.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function listAdminPayments(input: {
  cursorId?: bigint;
  limit: number;
  status?:
    | "initiated"
    | "pending"
    | "paid"
    | "failed"
    | "cancelled"
    | "partially_refunded"
    | "refunded";
  userId?: bigint;
}) {
  return prisma.subscriptionPayment.findMany({
    where: {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.status ? { status: input.status } : {}),
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
      user: { select: { publicId: true } },
    },
  });
}

export async function findAdminPaymentByPublicId(publicId: string) {
  return prisma.subscriptionPayment.findUnique({
    where: { publicId },
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
      publicId: true,
      status: true,
      transactionReference: true,
      paymentRefunds: {
        orderBy: { id: "asc" },
        select: {
          amountToman: true,
          createdAt: true,
          id: true,
          reason: true,
          status: true,
        },
      },
      subscription: { select: { publicId: true, status: true } },
      user: { select: { publicId: true } },
    },
  });
}

export async function findRefundCursorById(id: bigint) {
  return prisma.paymentRefund.findUnique({
    where: { id },
    select: { id: true },
  });
}

export async function listAdminRefunds(input: {
  cursorId?: bigint;
  limit: number;
  status?:
    | "requested"
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled";
}) {
  return prisma.paymentRefund.findMany({
    where: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      amountToman: true,
      createdAt: true,
      id: true,
      processedAt: true,
      reason: true,
      status: true,
      payment: { select: { publicId: true } },
      requestedByAdmin: { select: { publicId: true } },
    },
  });
}
