import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type { ProviderTab, ProvidersListQuery } from "@/server/modules/admin/providers/providers-admin.schemas";

type Db = TransactionClient | typeof prisma;

/** A subscription that covers `now`, the same window the app's search uses. */
export function activeSubscriptionWhere(now: Date): Prisma.ProviderSubscriptionWhereInput {
  return { endsAt: { gt: now }, startsAt: { lte: now }, status: "active" };
}

function tabWhere(tab: ProviderTab, now: Date): Prisma.ProviderProfileWhereInput {
  switch (tab) {
    case "active":
      return { isActive: 1 };
    case "inactive":
      return { isActive: 0 };
    case "unavailable":
      return { isActive: 1, isAvailable: 0 };
    case "no_subscription":
      return { providerSubscriptions: { none: activeSubscriptionWhere(now) } };
    case "eligible":
      return {
        isActive: 1,
        isAvailable: 1,
        providerServices: { some: { isActive: 1 } },
        providerSubscriptions: { some: activeSubscriptionWhere(now) },
        workLatitude: { not: null },
        workLongitude: { not: null },
      };
    default:
      return {};
  }
}

function baseWhere(filters: Pick<ProvidersListQuery, "province" | "q" | "service">): Prisma.ProviderProfileWhereInput {
  const user: Prisma.UserWhereInput = { deletedAt: null };
  if (filters.province) user.provinceId = BigInt(filters.province);
  const q = filters.q?.trim();
  if (q) {
    const or: Prisma.UserWhereInput[] = [{ name: { contains: q } }];
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    if (/^[0-9A-Za-z]{26}$/.test(q)) or.push({ publicId: q.toUpperCase() });
    user.OR = or;
  }
  return {
    user,
    ...(filters.service ? { providerServices: { some: { isActive: 1, serviceId: BigInt(filters.service) } } } : {}),
  };
}

const SORTS: Record<string, Prisma.ProviderProfileOrderByWithRelationInput[]> = {
  name: [{ user: { name: "asc" } }, { id: "asc" }],
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  services: [{ providerServices: { _count: "desc" } }, { id: "desc" }],
};

export async function listProviderRows(query: ProvidersListQuery, now: Date) {
  const where: Prisma.ProviderProfileWhereInput = { AND: [baseWhere(query), tabWhere(query.status, now)] };
  const [rows, total] = await Promise.all([
    prisma.providerProfile.findMany({
      orderBy: SORTS[query.sort] ?? SORTS.newest,
      select: {
        _count: { select: { providerServices: { where: { isActive: 1 } } } },
        approvedAt: true,
        createdAt: true,
        id: true,
        isActive: true,
        isAvailable: true,
        providerSubscriptions: {
          orderBy: { endsAt: "desc" },
          select: { endsAt: true, planNameSnapshot: true },
          take: 1,
          where: activeSubscriptionWhere(now),
        },
        user: {
          select: {
            city: { select: { name: true } },
            image: true,
            name: true,
            phone: true,
            province: { select: { name: true } },
            publicId: true,
          },
        },
        workLatitude: true,
        workLongitude: true,
        workRadiusKm: true,
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.providerProfile.count({ where }),
  ]);
  return { rows, total };
}

export async function countProvidersPerTab(
  filters: Pick<ProvidersListQuery, "province" | "q" | "service">,
  now: Date,
  tabs: readonly ProviderTab[],
) {
  const base = baseWhere(filters);
  const counts = await Promise.all(
    tabs.map((tab) => prisma.providerProfile.count({ where: { AND: [base, tabWhere(tab, now)] } })),
  );
  return Object.fromEntries(tabs.map((tab, index) => [tab, counts[index] ?? 0])) as Record<ProviderTab, number>;
}

export async function countCompletedJobs(profileIds: bigint[]) {
  if (profileIds.length === 0) return new Map<string, number>();
  const rows = await prisma.serviceRequest.groupBy({
    _count: { _all: true },
    by: ["assignedProviderProfileId"],
    where: { assignedProviderProfileId: { in: profileIds }, status: "completed" },
  });
  return new Map(rows.map((row) => [String(row.assignedProviderProfileId), row._count._all]));
}

export async function listProvinceOptions() {
  return prisma.province.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export async function listServiceOptions() {
  return prisma.service.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { id: "asc" }],
    select: {
      category: { select: { name: true } },
      id: true,
      image: true,
      isActive: true,
      name: true,
    },
    where: { category: { deletedAt: null }, deletedAt: null },
  });
}

// ---------------------------------------------------------------- detail

export async function findProviderProfile(db: Db, userPublicId: string) {
  return db.providerProfile.findFirst({
    select: {
      approvedAt: true,
      approvedByAdmin: { select: { name: true } },
      bio: true,
      createdAt: true,
      id: true,
      isActive: true,
      isAvailable: true,
      updatedAt: true,
      user: {
        select: {
          city: { select: { name: true } },
          deletedAt: true,
          id: true,
          image: true,
          lastLoginAt: true,
          name: true,
          phone: true,
          province: { select: { name: true } },
          publicId: true,
        },
      },
      workLatitude: true,
      workLongitude: true,
      workRadiusKm: true,
    },
    where: { user: { publicId: userPublicId } },
  });
}

export async function lockProviderProfile(transaction: TransactionClient, profileId: bigint) {
  await transaction.$queryRaw`SELECT id FROM provider_profiles WHERE id = ${profileId} FOR UPDATE`;
}

export async function updateProviderProfileRow(
  db: Db,
  profileId: bigint,
  data: Prisma.ProviderProfileUncheckedUpdateInput,
) {
  await db.providerProfile.update({ data: { ...data, updatedAt: new Date() }, where: { id: profileId } });
}

export async function listProviderServiceRows(profileId: bigint) {
  return prisma.providerService.findMany({
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
    select: {
      _count: { select: { serviceRequestCandidates: true, serviceRequestProviders: true } },
      createdAt: true,
      description: true,
      id: true,
      isActive: true,
      priceToman: true,
      pricingUnit: true,
      providerServicePriceHistories: {
        orderBy: { id: "desc" },
        select: {
          changedBy: true,
          changedByAdmin: { select: { name: true } },
          createdAt: true,
          newPriceToman: true,
          oldPriceToman: true,
        },
        take: 5,
      },
      service: {
        select: {
          category: { select: { isActive: true, name: true } },
          deletedAt: true,
          id: true,
          image: true,
          isActive: true,
          name: true,
        },
      },
      updatedAt: true,
    },
    where: { providerProfileId: profileId },
  });
}

export async function findActiveSubscriptionFor(db: Db, profileId: bigint, now: Date) {
  return db.providerSubscription.findFirst({
    orderBy: { endsAt: "desc" },
    select: { endsAt: true, planNameSnapshot: true, publicId: true, source: true, startsAt: true },
    where: { providerProfileId: profileId, ...activeSubscriptionWhere(now) },
  });
}

export async function listSubscriptionHistory(profileId: bigint) {
  return prisma.providerSubscription.findMany({
    orderBy: { id: "desc" },
    select: {
      amountToman: true,
      cancellationReason: true,
      cancelledAt: true,
      createdAt: true,
      endsAt: true,
      grantedByAdmin: { select: { name: true } },
      planNameSnapshot: true,
      publicId: true,
      source: true,
      startsAt: true,
      status: true,
    },
    take: 30,
    where: { providerProfileId: profileId },
  });
}

export async function listGallery(profileId: bigint) {
  return prisma.providerGalleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { caption: true, createdAt: true, publicId: true, url: true },
    where: { providerProfileId: profileId },
  });
}

export async function findGalleryImage(db: Db, profileId: bigint, publicId: string) {
  return db.providerGalleryImage.findFirst({
    select: { id: true, url: true },
    where: { providerProfileId: profileId, publicId },
  });
}

export async function deleteGalleryImageRow(db: Db, id: bigint) {
  await db.providerGalleryImage.delete({ where: { id } });
}

export async function loadProviderActivity(profileId: bigint) {
  const [links, jobs, revenue, recent] = await Promise.all([
    prisma.serviceRequestProvider.groupBy({
      _count: { _all: true },
      by: ["status"],
      where: { providerProfileId: profileId },
    }),
    prisma.serviceRequest.groupBy({
      _count: { _all: true },
      by: ["status"],
      where: { assignedProviderProfileId: profileId },
    }),
    prisma.serviceRequest.aggregate({
      _sum: { agreedPriceToman: true },
      where: { assignedProviderProfileId: profileId, status: "completed" },
    }),
    prisma.serviceRequestProvider.findMany({
      orderBy: { id: "desc" },
      select: {
        distanceKm: true,
        request: {
          select: {
            consumerNameSnapshot: true,
            createdAt: true,
            landTitleSnapshot: true,
            publicId: true,
            service: { select: { image: true } },
            serviceNameSnapshot: true,
            status: true,
          },
        },
        sentAt: true,
        servicePriceSnapshotToman: true,
        status: true,
      },
      take: 15,
      where: { providerProfileId: profileId },
    }),
  ]);
  return { jobs, links, recent, revenue: revenue._sum.agreedPriceToman ?? BigInt(0) };
}

// ---------------------------------------------------------------- services

export async function findCatalogService(db: Db, serviceId: bigint) {
  return db.service.findFirst({
    select: { category: { select: { deletedAt: true, isActive: true } }, id: true, isActive: true, name: true },
    where: { deletedAt: null, id: serviceId },
  });
}

export async function findProviderServiceRow(db: Db, profileId: bigint, providerServiceId: bigint) {
  return db.providerService.findFirst({
    select: {
      _count: { select: { serviceRequestCandidates: true, serviceRequestProviders: true } },
      description: true,
      id: true,
      isActive: true,
      priceToman: true,
      pricingUnit: true,
      service: { select: { name: true } },
      serviceId: true,
    },
    where: { id: providerServiceId, providerProfileId: profileId },
  });
}

export async function findProviderServiceByCatalogId(db: Db, profileId: bigint, serviceId: bigint) {
  return db.providerService.findUnique({
    select: { id: true, isActive: true, priceToman: true },
    where: { providerProfileId_serviceId: { providerProfileId: profileId, serviceId } },
  });
}

export async function insertProviderService(db: Db, data: Prisma.ProviderServiceUncheckedCreateInput) {
  return db.providerService.create({ data, select: { id: true } });
}

export async function updateProviderServiceRow(
  db: Db,
  providerServiceId: bigint,
  data: Prisma.ProviderServiceUncheckedUpdateInput,
) {
  await db.providerService.update({ data: { ...data, updatedAt: new Date() }, where: { id: providerServiceId } });
}

export async function deleteProviderServiceRow(db: Db, providerServiceId: bigint) {
  // Price history cascades.
  await db.providerService.delete({ where: { id: providerServiceId } });
}

export async function insertAdminPriceHistory(
  db: Db,
  input: { adminId: bigint; newPriceToman: bigint; oldPriceToman: bigint | null; providerServiceId: bigint; reason: string },
) {
  await db.providerServicePriceHistory.create({
    data: {
      changedBy: "admin",
      changedByAdminId: input.adminId,
      newPriceToman: input.newPriceToman,
      oldPriceToman: input.oldPriceToman,
      providerServiceId: input.providerServiceId,
      reason: input.reason,
    },
  });
}
