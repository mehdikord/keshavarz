import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

const profileSelect = {
  approvedAt: true,
  bio: true,
  id: true,
  isActive: true,
  isAvailable: true,
  workLatitude: true,
  workLongitude: true,
  workRadiusKm: true,
} as const;

export async function findProviderProfileByUserId(userId: bigint) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: profileSelect,
  });
}

export async function upsertProviderProfile(
  userId: bigint,
  bio?: string | null,
) {
  return prisma.providerProfile.upsert({
    where: { userId },
    create: {
      bio: bio ?? null,
      userId,
    },
    update: {
      ...(bio !== undefined ? { bio } : {}),
    },
    select: profileSelect,
  });
}

export async function updateProviderWorkArea(
  profileId: bigint,
  data: {
    isAvailable?: number;
    workLatitude?: string | null;
    workLongitude?: string | null;
    workRadiusKm?: number;
  },
) {
  return prisma.providerProfile.update({
    where: { id: profileId },
    data,
    select: profileSelect,
  });
}

export async function countActiveProviderServices(
  providerProfileId: bigint,
): Promise<number> {
  return prisma.providerService.count({
    where: { isActive: 1, providerProfileId },
  });
}

export async function findActiveSubscription(
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
      endsAt: true,
      planNameSnapshot: true,
      publicId: true,
      startsAt: true,
      status: true,
    },
  });
}

export async function listProviderServices(input: {
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
    select: {
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
    },
  });
}

export async function findActiveCatalogServiceBySlug(slug: string) {
  return prisma.service.findFirst({
    where: {
      deletedAt: null,
      isActive: 1,
      slug,
      category: { deletedAt: null, isActive: 1 },
    },
    select: { id: true, name: true, slug: true },
  });
}

export async function createProviderService(
  transaction: TransactionClient,
  input: {
    description?: string | null;
    priceToman: bigint;
    pricingUnit: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
    providerProfileId: bigint;
    serviceId: bigint;
  },
) {
  return transaction.providerService.create({
    data: {
      description: input.description ?? null,
      priceToman: input.priceToman,
      pricingUnit: input.pricingUnit,
      providerProfileId: input.providerProfileId,
      serviceId: input.serviceId,
    },
    select: {
      description: true,
      id: true,
      isActive: true,
      priceToman: true,
      pricingUnit: true,
      service: { select: { name: true, slug: true } },
      updatedAt: true,
    },
  });
}

export async function createInitialPriceHistory(
  transaction: TransactionClient,
  input: {
    changedByUserId: bigint;
    newPriceToman: bigint;
    providerServiceId: bigint;
  },
) {
  await transaction.providerServicePriceHistory.create({
    data: {
      changedBy: "provider",
      changedByUserId: input.changedByUserId,
      newPriceToman: input.newPriceToman,
      oldPriceToman: null,
      providerServiceId: input.providerServiceId,
      reason: "initial_price",
    },
  });
}

export async function findProviderServiceByServiceSlug(
  providerProfileId: bigint,
  serviceSlug: string,
) {
  return prisma.providerService.findFirst({
    where: {
      providerProfileId,
      service: { slug: serviceSlug },
    },
    select: {
      description: true,
      id: true,
      isActive: true,
      priceToman: true,
      pricingUnit: true,
      service: { select: { name: true, slug: true } },
      updatedAt: true,
    },
  });
}

export async function updateProviderServiceInTransaction(
  transaction: TransactionClient,
  providerServiceId: bigint,
  data: {
    description?: string | null;
    isActive?: number;
    priceToman?: bigint;
    pricingUnit?: "fixed" | "per_hectare" | "per_square_meter" | "per_hour" | "per_day";
  },
) {
  return transaction.providerService.update({
    where: { id: providerServiceId },
    data,
    select: {
      description: true,
      id: true,
      isActive: true,
      priceToman: true,
      pricingUnit: true,
      service: { select: { name: true, slug: true } },
      updatedAt: true,
    },
  });
}

export async function createPriceChangeHistory(
  transaction: TransactionClient,
  input: {
    changedByUserId: bigint;
    newPriceToman: bigint;
    oldPriceToman: bigint;
    providerServiceId: bigint;
  },
) {
  await transaction.providerServicePriceHistory.create({
    data: {
      changedBy: "provider",
      changedByUserId: input.changedByUserId,
      newPriceToman: input.newPriceToman,
      oldPriceToman: input.oldPriceToman,
      providerServiceId: input.providerServiceId,
      reason: "provider_price_update",
    },
  });
}

export async function countProviderInboxByStatus(
  providerProfileId: bigint,
  status: "sent" | "accepted",
): Promise<number> {
  if (status === "sent") {
    return prisma.serviceRequestProvider.count({
      where: {
        providerProfileId,
        status: "sent",
        request: { status: "pending_provider" },
      },
    });
  }

  return prisma.serviceRequest.count({
    where: {
      assignedProviderProfileId: providerProfileId,
      status: "in_progress",
    },
  });
}

export async function sumCompletedRevenueThisMonth(
  providerProfileId: bigint,
  monthStart: Date,
  monthEnd: Date,
): Promise<bigint> {
  const result = await prisma.serviceRequest.aggregate({
    where: {
      assignedProviderProfileId: providerProfileId,
      completedAt: {
        gte: monthStart,
        lt: monthEnd,
      },
      status: "completed",
    },
    _sum: { agreedPriceToman: true },
  });
  return result._sum.agreedPriceToman ?? BigInt(0);
}

export async function countUnreadUserNotifications(
  userId: bigint,
): Promise<number> {
  return prisma.notification.count({
    where: {
      readAt: null,
      recipientType: "user",
      userId,
    },
  });
}

const publicProfileSelect = {
  approvedAt: true,
  bio: true,
  id: true,
  isActive: true,
  isAvailable: true,
  workRadiusKm: true,
  user: {
    select: {
      city: { select: { name: true } },
      deletedAt: true,
      image: true,
      isActive: true,
      name: true,
      province: { select: { name: true } },
      publicId: true,
    },
  },
} as const;

export async function findPublicProviderProfileByUserPublicId(
  publicId: string,
) {
  return prisma.providerProfile.findFirst({
    where: {
      isActive: 1,
      user: { deletedAt: null, isActive: 1, publicId },
    },
    select: publicProfileSelect,
  });
}

export async function listActivePublicProviderServices(
  providerProfileId: bigint,
) {
  return prisma.providerService.findMany({
    where: {
      isActive: 1,
      providerProfileId,
      service: {
        deletedAt: null,
        isActive: 1,
        category: { deletedAt: null, isActive: 1 },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: {
      description: true,
      priceToman: true,
      pricingUnit: true,
      service: {
        select: {
          category: { select: { name: true } },
          image: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function listProviderGalleryImages(providerProfileId: bigint) {
  return prisma.providerGalleryImage.findMany({
    where: { providerProfileId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      caption: true,
      createdAt: true,
      publicId: true,
      sortOrder: true,
      url: true,
    },
  });
}

export async function countProviderGalleryImages(
  providerProfileId: bigint,
): Promise<number> {
  return prisma.providerGalleryImage.count({
    where: { providerProfileId },
  });
}

export async function createProviderGalleryImage(input: {
  caption?: string | null;
  providerProfileId: bigint;
  publicId: string;
  sortOrder: number;
  url: string;
}) {
  return prisma.providerGalleryImage.create({
    data: {
      caption: input.caption ?? null,
      providerProfileId: input.providerProfileId,
      publicId: input.publicId,
      sortOrder: input.sortOrder,
      url: input.url,
    },
    select: {
      caption: true,
      createdAt: true,
      publicId: true,
      sortOrder: true,
      url: true,
    },
  });
}

export async function findProviderGalleryImageByPublicId(
  providerProfileId: bigint,
  publicId: string,
) {
  return prisma.providerGalleryImage.findFirst({
    where: { providerProfileId, publicId },
    select: {
      caption: true,
      createdAt: true,
      id: true,
      publicId: true,
      sortOrder: true,
      url: true,
    },
  });
}

export async function deleteProviderGalleryImage(id: bigint) {
  await prisma.providerGalleryImage.delete({ where: { id } });
}
