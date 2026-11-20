import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type { RequestsListQuery } from "@/server/modules/admin/requests/requests-admin.schemas";

const PUBLIC_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

function periodStart(period: RequestsListQuery["period"], now: Date): Date | null {
  const days = { "7d": 7, "30d": 30, "90d": 90 } as const;
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period in days) return new Date(now.getTime() - days[period as keyof typeof days] * 86_400_000);
  return null;
}

/**
 * Everything but the status, so the status tabs can count with the same filters.
 * ASCII-only columns (public id, phone) are only compared with ASCII input.
 */
function listFilters(query: RequestsListQuery, now: Date): Prisma.ServiceRequestWhereInput {
  const and: Prisma.ServiceRequestWhereInput[] = [];

  const q = query.q?.trim();
  if (q) {
    const upper = q.toUpperCase();
    if (PUBLIC_ID.test(upper)) {
      and.push({ publicId: upper });
    } else if (/^\+?\d{3,}$/.test(q)) {
      const digits = q.replace(/^\+?98/, "0");
      and.push({
        OR: [
          { consumer: { phone: { contains: digits } } },
          { assignedProvider: { user: { phone: { contains: digits } } } },
        ],
      });
    } else {
      and.push({
        OR: [
          { consumerNameSnapshot: { contains: q } },
          { consumer: { name: { contains: q } } },
          { assignedProviderNameSnapshot: { contains: q } },
          { serviceNameSnapshot: { contains: q } },
          { landTitleSnapshot: { contains: q } },
        ],
      });
    }
  }

  if (query.service) {
    const [kind, id] = query.service.split(":") as ["c" | "s", string];
    and.push(kind === "s" ? { serviceId: BigInt(id) } : { service: { serviceCategoryId: BigInt(id) } });
  }

  const since = periodStart(query.period, now);
  if (since) and.push({ createdAt: { gte: since } });

  return and.length ? { AND: and } : {};
}

function listOrder(sort: RequestsListQuery["sort"]): Prisma.ServiceRequestOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ id: "asc" }];
    case "updated":
      return [{ updatedAt: "desc" }, { id: "desc" }];
    case "price":
      return [{ agreedPriceToman: "desc" }, { id: "desc" }];
    default:
      return [{ id: "desc" }];
  }
}

export async function listRequestRows(query: RequestsListQuery, now: Date) {
  const where: Prisma.ServiceRequestWhereInput = {
    ...listFilters(query, now),
    ...(query.status !== "all" ? { status: query.status } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      orderBy: listOrder(query.sort),
      select: {
        _count: { select: { serviceRequestProviders: true } },
        agreedPriceToman: true,
        assignedProvider: { select: { user: { select: { publicId: true } } } },
        assignedProviderNameSnapshot: true,
        consumer: { select: { name: true, phone: true, publicId: true } },
        consumerNameSnapshot: true,
        createdAt: true,
        landAreaSquareMetersSnapshot: true,
        landTitleSnapshot: true,
        publicId: true,
        service: { select: { image: true } },
        serviceCategoryNameSnapshot: true,
        serviceNameSnapshot: true,
        serviceRequestDates: { orderBy: { scheduledDate: "asc" }, select: { scheduledDate: true } },
        status: true,
        updatedAt: true,
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      where,
    }),
    prisma.serviceRequest.count({ where }),
  ]);
  return { rows, total };
}

export async function countRequestsPerStatus(query: RequestsListQuery, now: Date) {
  const rows = await prisma.serviceRequest.groupBy({
    _count: { _all: true },
    by: ["status"],
    where: listFilters(query, now),
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all])) as Record<string, number>;
}

export async function listServiceFilterOptions() {
  return prisma.serviceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      services: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { id: true, name: true },
        where: { deletedAt: null },
      },
    },
    where: { deletedAt: null },
  });
}

const ACTOR = {
  actorAdmin: { select: { name: true } },
  actorType: true,
  actorUser: { select: { name: true, phone: true } },
} as const;

export async function findRequestDetail(publicId: string) {
  return prisma.serviceRequest.findUnique({
    select: {
      acceptedAt: true,
      agreedPriceToman: true,
      assignedProvider: {
        select: { user: { select: { image: true, name: true, phone: true, publicId: true } }, workRadiusKm: true },
      },
      assignedProviderNameSnapshot: true,
      cancelReason: true,
      cancelledAt: true,
      cancelledBy: true,
      cancelledByAdmin: { select: { name: true } },
      cancelledByUser: { select: { name: true, phone: true } },
      completedAt: true,
      consumer: { select: { deletedAt: true, image: true, name: true, phone: true, publicId: true } },
      consumerNameSnapshot: true,
      consumerNote: true,
      createdAt: true,
      id: true,
      land: { select: { deletedAt: true, publicId: true, title: true } },
      landAreaSquareMetersSnapshot: true,
      landLatitudeSnapshot: true,
      landLongitudeSnapshot: true,
      landTitleSnapshot: true,
      publicId: true,
      searchPublicId: true,
      service: { select: { id: true, image: true, isActive: true, name: true } },
      serviceCategoryNameSnapshot: true,
      serviceNameSnapshot: true,
      serviceRequestCandidates: {
        orderBy: [{ servicePriceSnapshotToman: "asc" }, { distanceKm: "asc" }],
        select: {
          distanceKm: true,
          foundAt: true,
          id: true,
          pricingUnitSnapshot: true,
          providerNameSnapshot: true,
          providerProfile: { select: { user: { select: { publicId: true } } } },
          servicePriceSnapshotToman: true,
        },
      },
      serviceRequestDates: { orderBy: { scheduledDate: "asc" }, select: { scheduledDate: true } },
      serviceRequestProviders: {
        orderBy: { id: "asc" },
        select: {
          distanceKm: true,
          id: true,
          providerNameSnapshot: true,
          providerProfile: { select: { user: { select: { phone: true, publicId: true } } } },
          rejectionReason: true,
          removedReason: true,
          respondedAt: true,
          sentAt: true,
          serviceRequestProviderHistories: {
            orderBy: { id: "asc" },
            select: { ...ACTOR, createdAt: true, fromStatus: true, id: true, reason: true, toStatus: true },
          },
          servicePriceSnapshotToman: true,
          status: true,
          viewedAt: true,
        },
      },
      serviceRequestStatusHistories: {
        orderBy: { id: "asc" },
        select: { ...ACTOR, createdAt: true, fromStatus: true, id: true, reason: true, toStatus: true },
      },
      status: true,
      updatedAt: true,
      version: true,
    },
    where: { publicId },
  });
}

export async function countRequestNotifications(requestId: bigint) {
  return prisma.notification.count({ where: { relatedServiceRequestId: requestId } });
}

/** Locks one provider invitation of a request for an admin change. */
export async function lockRequestLinkById(transaction: TransactionClient, requestId: bigint, linkId: bigint) {
  const rows = await transaction.$queryRaw<
    Array<{ id: bigint; providerNameSnapshot: string; providerProfileId: bigint; status: string }>
  >`
    SELECT id,
           provider_name_snapshot AS providerNameSnapshot,
           provider_profile_id AS providerProfileId,
           status
    FROM service_request_providers
    WHERE id = ${linkId}
      AND service_request_id = ${requestId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function removeProviderLinkByAdmin(
  transaction: TransactionClient,
  input: { adminId: bigint; linkId: bigint; now: Date; reason: string },
) {
  await transaction.serviceRequestProvider.update({
    data: { removedReason: "admin_removed", status: "removed", updatedAt: input.now },
    where: { id: input.linkId },
  });
  await transaction.serviceRequestProviderHistory.create({
    data: {
      actorAdminId: input.adminId,
      actorType: "admin",
      fromStatus: "sent",
      reason: input.reason,
      serviceRequestProviderId: input.linkId,
      toStatus: "removed",
    },
  });
}
