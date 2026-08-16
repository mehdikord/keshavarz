import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

const listSelect = {
  approvedAt: true,
  bio: true,
  createdAt: true,
  id: true,
  isActive: true,
  isAvailable: true,
  user: {
    select: {
      id: true,
      image: true,
      name: true,
      phone: true,
      publicId: true,
    },
  },
  workRadiusKm: true,
} as const;

const detailSelect = {
  ...listSelect,
  updatedAt: true,
  workLatitude: true,
  workLongitude: true,
  _count: {
    select: {
      providerServices: true,
    },
  },
} as const;

const providerServiceSelect = {
  description: true,
  id: true,
  isActive: true,
  priceToman: true,
  pricingUnit: true,
  service: {
    select: {
      name: true,
      slug: true,
    },
  },
  updatedAt: true,
} as const;

export async function findProviderProfileIdByUserPublicId(publicId: string) {
  return prisma.providerProfile.findFirst({
    where: { user: { deletedAt: null, publicId } },
    select: {
      id: true,
      user: { select: { id: true, publicId: true } },
    },
  });
}

export async function findProviderCursorByUserPublicId(publicId: string) {
  return prisma.providerProfile.findFirst({
    where: { user: { deletedAt: null, publicId } },
    select: { id: true },
  });
}

export async function listAdminProviders(input: {
  approved?: "yes" | "no";
  cursorId?: bigint;
  isActive?: 0 | 1;
  isAvailable?: 0 | 1;
  limit: number;
  q?: string;
}) {
  return prisma.providerProfile.findMany({
    where: {
      user: {
        deletedAt: null,
        ...(input.q
          ? {
              OR: [
                { name: { contains: input.q } },
                { phone: { contains: input.q } },
              ],
            }
          : {}),
      },
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.isAvailable === undefined
        ? {}
        : { isAvailable: input.isAvailable }),
      ...(input.approved === "yes"
        ? { approvedAt: { not: null } }
        : input.approved === "no"
          ? { approvedAt: null }
          : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: listSelect,
  });
}

export async function findAdminProviderDetailByUserPublicId(publicId: string) {
  return prisma.providerProfile.findFirst({
    where: { user: { deletedAt: null, publicId } },
    select: detailSelect,
  });
}

export async function findActiveSubscriptionSummary(
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

export async function updateAdminProviderProfile(
  profileId: bigint,
  data: {
    bio?: string | null;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
) {
  return prisma.providerProfile.update({
    where: { id: profileId },
    data,
    select: detailSelect,
  });
}

export async function approveAdminProviderProfile(input: {
  adminId: bigint;
  isActive: boolean;
  now: Date;
  profileId: bigint;
}) {
  return prisma.providerProfile.update({
    where: { id: input.profileId },
    data: {
      approvedAt: input.now,
      approvedByAdminId: input.adminId,
      isActive: input.isActive ? 1 : 0,
    },
    select: detailSelect,
  });
}

export async function updateAdminProviderAvailability(
  profileId: bigint,
  data: {
    isActive?: boolean;
    isAvailable?: boolean;
  },
) {
  return prisma.providerProfile.update({
    where: { id: profileId },
    data: {
      ...(data.isActive === undefined
        ? {}
        : { isActive: data.isActive ? 1 : 0 }),
      ...(data.isAvailable === undefined
        ? {}
        : { isAvailable: data.isAvailable ? 1 : 0 }),
    },
    select: detailSelect,
  });
}

export async function listAdminProviderServices(input: {
  cursorId?: bigint;
  limit: number;
  providerProfileId: bigint;
}) {
  return prisma.providerService.findMany({
    where: {
      providerProfileId: input.providerProfileId,
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: providerServiceSelect,
  });
}

export async function findAdminProviderServiceById(id: bigint) {
  return prisma.providerService.findUnique({
    where: { id },
    select: {
      ...providerServiceSelect,
      providerProfileId: true,
    },
  });
}

export async function updateAdminProviderServiceInTransaction(
  transaction: TransactionClient,
  providerServiceId: bigint,
  data: {
    description?: string | null;
    isActive?: number;
    priceToman?: bigint;
    pricingUnit?:
      | "fixed"
      | "per_hectare"
      | "per_square_meter"
      | "per_hour"
      | "per_day";
  },
) {
  return transaction.providerService.update({
    where: { id: providerServiceId },
    data,
    select: providerServiceSelect,
  });
}

export async function createAdminPriceChangeHistory(
  transaction: TransactionClient,
  input: {
    changedByAdminId: bigint;
    newPriceToman: bigint;
    oldPriceToman: bigint;
    providerServiceId: bigint;
  },
) {
  await transaction.providerServicePriceHistory.create({
    data: {
      changedBy: "admin",
      changedByAdminId: input.changedByAdminId,
      newPriceToman: input.newPriceToman,
      oldPriceToman: input.oldPriceToman,
      providerServiceId: input.providerServiceId,
      reason: "admin_price_update",
    },
  });
}
