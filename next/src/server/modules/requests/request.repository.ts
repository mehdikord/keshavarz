import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

export async function findUserSnapshot(userId: bigint) {
  return prisma.user.findFirst({
    where: { deletedAt: null, id: userId, isActive: 1 },
    select: { id: true, name: true, phone: true, publicId: true },
  });
}

export async function findLandSnapshot(landId: bigint, userId: bigint) {
  return prisma.land.findFirst({
    where: {
      deletedAt: null,
      id: landId,
      isActive: 1,
      userId,
    },
    select: {
      areaSquareMeters: true,
      id: true,
      latitude: true,
      longitude: true,
      publicId: true,
      title: true,
    },
  });
}

export async function findProviderProfileIdByUserId(userId: bigint) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
}

export async function createServiceRequestWithProviders(
  transaction: TransactionClient,
  input: {
    consumerName: string;
    consumerNote: string | null;
    consumerUserId: bigint;
    dates: string[];
    land: {
      areaSquareMeters: { toString(): string } | string;
      id: bigint;
      latitude: { toString(): string } | string;
      longitude: { toString(): string } | string;
      title: string;
    };
    providers: Array<{
      distanceKm: number;
      providerName: string;
      providerProfileId: bigint;
      providerServiceId: bigint;
      priceToman: bigint;
    }>;
    publicId: string;
    serviceCategoryName: string;
    serviceId: bigint;
    serviceName: string;
  },
) {
  const request = await transaction.serviceRequest.create({
    data: {
      consumerNameSnapshot: input.consumerName,
      consumerNote: input.consumerNote,
      consumerUserId: input.consumerUserId,
      landAreaSquareMetersSnapshot: input.land.areaSquareMeters.toString(),
      landId: input.land.id,
      landLatitudeSnapshot: input.land.latitude.toString(),
      landLongitudeSnapshot: input.land.longitude.toString(),
      landTitleSnapshot: input.land.title,
      publicId: input.publicId,
      serviceCategoryNameSnapshot: input.serviceCategoryName,
      serviceId: input.serviceId,
      serviceNameSnapshot: input.serviceName,
      status: "pending_provider",
    },
    select: {
      id: true,
      publicId: true,
      status: true,
      version: true,
      createdAt: true,
    },
  });

  await transaction.serviceRequestDate.createMany({
    data: input.dates.map((date, index) => ({
      scheduledDate: new Date(`${date}T00:00:00.000Z`),
      serviceRequestId: request.id,
      sortOrder: index,
    })),
  });

  await transaction.serviceRequestStatusHistory.create({
    data: {
      actorType: "consumer",
      actorUserId: input.consumerUserId,
      fromStatus: null,
      serviceRequestId: request.id,
      toStatus: "pending_provider",
    },
  });

  for (const provider of input.providers) {
    const link = await transaction.serviceRequestProvider.create({
      data: {
        distanceKm: provider.distanceKm.toFixed(2),
        providerNameSnapshot: provider.providerName,
        providerProfileId: provider.providerProfileId,
        providerServiceId: provider.providerServiceId,
        servicePriceSnapshotToman: provider.priceToman,
        serviceRequestId: request.id,
        status: "sent",
      },
      select: { id: true },
    });

    await transaction.serviceRequestProviderHistory.create({
      data: {
        actorType: "consumer",
        actorUserId: input.consumerUserId,
        fromStatus: null,
        serviceRequestProviderId: link.id,
        toStatus: "sent",
      },
    });
  }

  return request;
}

export async function findRequestByPublicId(publicId: string) {
  return prisma.serviceRequest.findUnique({
    where: { publicId },
    select: {
      acceptedAt: true,
      agreedPriceToman: true,
      assignedProviderNameSnapshot: true,
      assignedProviderProfileId: true,
      cancelReason: true,
      cancelledAt: true,
      cancelledBy: true,
      completedAt: true,
      consumerNote: true,
      consumerUserId: true,
      createdAt: true,
      id: true,
      landAreaSquareMetersSnapshot: true,
      landId: true,
      landLatitudeSnapshot: true,
      landLongitudeSnapshot: true,
      landTitleSnapshot: true,
      publicId: true,
      serviceCategoryNameSnapshot: true,
      serviceId: true,
      serviceNameSnapshot: true,
      status: true,
      version: true,
    },
  });
}

export async function listConsumerRequests(input: {
  cursorId?: bigint;
  limit: number;
  status?: "pending_provider" | "in_progress" | "completed" | "cancelled";
  userId: bigint;
}) {
  return prisma.serviceRequest.findMany({
    where: {
      consumerUserId: input.userId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      agreedPriceToman: true,
      assignedProviderNameSnapshot: true,
      createdAt: true,
      id: true,
      landTitleSnapshot: true,
      publicId: true,
      serviceNameSnapshot: true,
      status: true,
      version: true,
    },
  });
}

export async function listRequestDates(requestId: bigint) {
  const rows = await prisma.serviceRequestDate.findMany({
    where: { serviceRequestId: requestId },
    orderBy: { sortOrder: "asc" },
    select: { scheduledDate: true },
  });
  return rows.map((row) => row.scheduledDate.toISOString().slice(0, 10));
}

export async function listRequestProviderLinks(requestId: bigint) {
  return prisma.serviceRequestProvider.findMany({
    where: { serviceRequestId: requestId },
    orderBy: { id: "asc" },
    select: {
      distanceKm: true,
      id: true,
      providerNameSnapshot: true,
      providerProfileId: true,
      providerServiceId: true,
      servicePriceSnapshotToman: true,
      status: true,
      viewedAt: true,
      providerProfile: {
        select: {
          user: { select: { phone: true, publicId: true } },
        },
      },
    },
  });
}

export async function findExistingProviderLinks(
  requestId: bigint,
  providerProfileIds: bigint[],
) {
  return prisma.serviceRequestProvider.findMany({
    where: {
      providerProfileId: { in: providerProfileIds },
      serviceRequestId: requestId,
    },
    select: { providerProfileId: true, status: true },
  });
}

export async function addProvidersToRequest(
  transaction: TransactionClient,
  input: {
    actorUserId: bigint;
    providers: Array<{
      distanceKm: number;
      providerName: string;
      providerProfileId: bigint;
      providerServiceId: bigint;
      priceToman: bigint;
    }>;
    requestId: bigint;
  },
) {
  for (const provider of input.providers) {
    const link = await transaction.serviceRequestProvider.create({
      data: {
        distanceKm: provider.distanceKm.toFixed(2),
        providerNameSnapshot: provider.providerName,
        providerProfileId: provider.providerProfileId,
        providerServiceId: provider.providerServiceId,
        servicePriceSnapshotToman: provider.priceToman,
        serviceRequestId: input.requestId,
        status: "sent",
      },
      select: { id: true },
    });
    await transaction.serviceRequestProviderHistory.create({
      data: {
        actorType: "consumer",
        actorUserId: input.actorUserId,
        fromStatus: null,
        serviceRequestProviderId: link.id,
        toStatus: "sent",
      },
    });
  }
}

export async function listProviderInbox(input: {
  cursorId?: bigint;
  limit: number;
  linkStatus?: "sent" | "accepted" | "rejected" | "removed";
  providerProfileId: bigint;
}) {
  return prisma.serviceRequestProvider.findMany({
    where: {
      providerProfileId: input.providerProfileId,
      ...(input.linkStatus ? { status: input.linkStatus } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      distanceKm: true,
      id: true,
      sentAt: true,
      servicePriceSnapshotToman: true,
      status: true,
      request: {
        select: {
          landTitleSnapshot: true,
          publicId: true,
          serviceNameSnapshot: true,
          status: true,
          version: true,
        },
      },
    },
  });
}

export async function findProviderLinkForRequest(
  requestId: bigint,
  providerProfileId: bigint,
) {
  return prisma.serviceRequestProvider.findFirst({
    where: { providerProfileId, serviceRequestId: requestId },
    select: {
      distanceKm: true,
      id: true,
      providerNameSnapshot: true,
      providerProfileId: true,
      providerServiceId: true,
      servicePriceSnapshotToman: true,
      status: true,
      viewedAt: true,
    },
  });
}

export async function markProviderLinkViewed(
  linkId: bigint,
  now: Date,
): Promise<boolean> {
  const result = await prisma.serviceRequestProvider.updateMany({
    where: { id: linkId, viewedAt: null },
    data: { viewedAt: now },
  });
  return result.count > 0;
}

export async function lockServiceRequestByPublicId(
  transaction: TransactionClient,
  publicId: string,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      assignedProviderProfileId: bigint | null;
      consumerUserId: bigint;
      id: bigint;
      publicId: string;
      status: string;
      version: number;
    }>
  >`
    SELECT id,
           public_id AS publicId,
           consumer_user_id AS consumerUserId,
           assigned_provider_profile_id AS assignedProviderProfileId,
           status,
           version
    FROM service_requests
    WHERE public_id = ${publicId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0]
    ? {
        ...rows[0],
        version: Number(rows[0].version),
      }
    : null;
}

export async function lockProviderLink(
  transaction: TransactionClient,
  requestId: bigint,
  providerProfileId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      id: bigint;
      providerNameSnapshot: string;
      providerServiceId: bigint;
      servicePriceSnapshotToman: bigint;
      status: string;
    }>
  >`
    SELECT id,
           provider_name_snapshot AS providerNameSnapshot,
           provider_service_id AS providerServiceId,
           service_price_snapshot_toman AS servicePriceSnapshotToman,
           status
    FROM service_request_providers
    WHERE service_request_id = ${requestId}
      AND provider_profile_id = ${providerProfileId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function acceptServiceRequest(
  transaction: TransactionClient,
  input: {
    acceptedAt: Date;
    expectedVersion?: number;
    linkId: bigint;
    providerName: string;
    providerProfileId: bigint;
    providerUserId: bigint;
    requestId: bigint;
    servicePriceToman: bigint;
  },
) {
  const updated = await transaction.serviceRequest.updateMany({
    where: {
      id: input.requestId,
      status: "pending_provider",
      ...(input.expectedVersion !== undefined
        ? { version: input.expectedVersion }
        : {}),
    },
    data: {
      acceptedAt: input.acceptedAt,
      agreedPriceToman: input.servicePriceToman,
      assignedProviderNameSnapshot: input.providerName,
      assignedProviderProfileId: input.providerProfileId,
      status: "in_progress",
      version: { increment: 1 },
      updatedAt: input.acceptedAt,
    },
  });

  if (updated.count !== 1) {
    return { ok: false as const };
  }

  await transaction.serviceRequestProvider.update({
    where: { id: input.linkId },
    data: {
      respondedAt: input.acceptedAt,
      status: "accepted",
      updatedAt: input.acceptedAt,
    },
  });

  await transaction.serviceRequestProviderHistory.create({
    data: {
      actorType: "provider",
      actorUserId: input.providerUserId,
      fromStatus: "sent",
      serviceRequestProviderId: input.linkId,
      toStatus: "accepted",
    },
  });

  const otherLinks = await transaction.serviceRequestProvider.findMany({
    where: {
      id: { not: input.linkId },
      serviceRequestId: input.requestId,
      status: "sent",
    },
    select: { id: true },
  });

  if (otherLinks.length > 0) {
    await transaction.serviceRequestProvider.updateMany({
      where: { id: { in: otherLinks.map((link) => link.id) } },
      data: {
        removedReason: "accepted_by_other",
        status: "removed",
        updatedAt: input.acceptedAt,
      },
    });
    for (const link of otherLinks) {
      await transaction.serviceRequestProviderHistory.create({
        data: {
          actorType: "system",
          fromStatus: "sent",
          serviceRequestProviderId: link.id,
          toStatus: "removed",
          reason: "accepted_by_other",
        },
      });
    }
  }

  await transaction.serviceRequestStatusHistory.create({
    data: {
      actorType: "provider",
      actorUserId: input.providerUserId,
      fromStatus: "pending_provider",
      serviceRequestId: input.requestId,
      toStatus: "in_progress",
    },
  });

  return { ok: true as const };
}

export async function rejectProviderLink(
  transaction: TransactionClient,
  input: {
    linkId: bigint;
    now: Date;
    providerUserId: bigint;
    reason?: string | null;
  },
) {
  await transaction.serviceRequestProvider.update({
    where: { id: input.linkId },
    data: {
      rejectionReason: input.reason ?? null,
      respondedAt: input.now,
      status: "rejected",
      updatedAt: input.now,
    },
  });
  await transaction.serviceRequestProviderHistory.create({
    data: {
      actorType: "provider",
      actorUserId: input.providerUserId,
      fromStatus: "sent",
      reason: input.reason ?? null,
      serviceRequestProviderId: input.linkId,
      toStatus: "rejected",
    },
  });
}

export async function cancelServiceRequest(
  transaction: TransactionClient,
  input: {
    actorAdminId?: bigint | null;
    actorType: "consumer" | "provider" | "admin";
    actorUserId?: bigint | null;
    cancelledBy: "consumer" | "provider" | "admin";
    expectedVersion?: number;
    fromStatus: "pending_provider" | "in_progress";
    now: Date;
    reason: string | null;
    requestId: bigint;
  },
) {
  const updated = await transaction.serviceRequest.updateMany({
    where: {
      id: input.requestId,
      status: input.fromStatus,
      ...(input.expectedVersion !== undefined
        ? { version: input.expectedVersion }
        : {}),
    },
    data: {
      cancelReason: input.reason,
      cancelledAt: input.now,
      cancelledBy: input.cancelledBy,
      cancelledByAdminId: input.actorAdminId ?? null,
      cancelledByUserId: input.actorUserId ?? null,
      status: "cancelled",
      version: { increment: 1 },
      updatedAt: input.now,
    },
  });

  if (updated.count !== 1) {
    return { ok: false as const };
  }

  await transaction.serviceRequestStatusHistory.create({
    data: {
      actorAdminId: input.actorAdminId ?? null,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      fromStatus: input.fromStatus,
      reason: input.reason,
      serviceRequestId: input.requestId,
      toStatus: "cancelled",
    },
  });

  const openLinks = await transaction.serviceRequestProvider.findMany({
    where: {
      serviceRequestId: input.requestId,
      status: { in: ["sent", "accepted"] },
    },
    select: { id: true, status: true },
  });

  if (openLinks.length > 0) {
    await transaction.serviceRequestProvider.updateMany({
      where: { id: { in: openLinks.map((link) => link.id) } },
      data: {
        removedReason: "request_cancelled",
        status: "removed",
        updatedAt: input.now,
      },
    });
    for (const link of openLinks) {
      await transaction.serviceRequestProviderHistory.create({
        data: {
          actorAdminId: input.actorAdminId ?? null,
          actorType: input.actorType,
          actorUserId: input.actorUserId ?? null,
          fromStatus: link.status as "sent" | "accepted",
          reason: "request_cancelled",
          serviceRequestProviderId: link.id,
          toStatus: "removed",
        },
      });
    }
  }

  return { ok: true as const };
}

export async function completeServiceRequest(
  transaction: TransactionClient,
  input: {
    consumerUserId: bigint;
    expectedVersion?: number;
    now: Date;
    requestId: bigint;
  },
) {
  const updated = await transaction.serviceRequest.updateMany({
    where: {
      id: input.requestId,
      status: "in_progress",
      ...(input.expectedVersion !== undefined
        ? { version: input.expectedVersion }
        : {}),
    },
    data: {
      completedAt: input.now,
      status: "completed",
      version: { increment: 1 },
      updatedAt: input.now,
    },
  });

  if (updated.count !== 1) {
    return { ok: false as const };
  }

  await transaction.serviceRequestStatusHistory.create({
    data: {
      actorType: "consumer",
      actorUserId: input.consumerUserId,
      fromStatus: "in_progress",
      serviceRequestId: input.requestId,
      toStatus: "completed",
    },
  });

  return { ok: true as const };
}

export async function findProviderUserIdByProfileId(profileId: bigint) {
  const profile = await prisma.providerProfile.findUnique({
    where: { id: profileId },
    select: { userId: true, user: { select: { publicId: true, phone: true } } },
  });
  return profile;
}

export async function listSentLinkProviderUserIds(requestId: bigint) {
  const links = await prisma.serviceRequestProvider.findMany({
    where: {
      serviceRequestId: requestId,
      status: { in: ["sent", "accepted"] },
    },
    select: {
      providerProfile: { select: { userId: true } },
    },
  });
  return links.map((link) => link.providerProfile.userId);
}

export async function findUserIdByPublicId(publicId: string) {
  return prisma.user.findUnique({
    where: { publicId },
    select: { id: true, publicId: true },
  });
}

export async function listAdminServiceRequests(input: {
  consumerUserId?: bigint;
  cursorId?: bigint;
  limit: number;
  publicId?: string;
  status?: "pending_provider" | "in_progress" | "completed" | "cancelled";
}) {
  return prisma.serviceRequest.findMany({
    where: {
      ...(input.consumerUserId
        ? { consumerUserId: input.consumerUserId }
        : {}),
      ...(input.publicId ? { publicId: input.publicId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: {
      agreedPriceToman: true,
      assignedProviderNameSnapshot: true,
      createdAt: true,
      id: true,
      landTitleSnapshot: true,
      publicId: true,
      serviceNameSnapshot: true,
      status: true,
      version: true,
      consumer: { select: { publicId: true } },
    },
  });
}

export async function findAdminRequestByPublicId(publicId: string) {
  return prisma.serviceRequest.findUnique({
    where: { publicId },
    select: {
      acceptedAt: true,
      agreedPriceToman: true,
      assignedProviderNameSnapshot: true,
      assignedProviderProfileId: true,
      cancelReason: true,
      cancelledAt: true,
      cancelledBy: true,
      completedAt: true,
      consumerNameSnapshot: true,
      consumerNote: true,
      consumerUserId: true,
      createdAt: true,
      id: true,
      landAreaSquareMetersSnapshot: true,
      landLatitudeSnapshot: true,
      landLongitudeSnapshot: true,
      landTitleSnapshot: true,
      publicId: true,
      serviceCategoryNameSnapshot: true,
      serviceNameSnapshot: true,
      status: true,
      version: true,
      consumer: { select: { publicId: true } },
    },
  });
}

export async function listAdminRequestProviderLinks(requestId: bigint) {
  return prisma.serviceRequestProvider.findMany({
    where: { serviceRequestId: requestId },
    orderBy: { id: "asc" },
    select: {
      distanceKm: true,
      id: true,
      providerNameSnapshot: true,
      rejectionReason: true,
      removedReason: true,
      respondedAt: true,
      sentAt: true,
      servicePriceSnapshotToman: true,
      status: true,
      viewedAt: true,
      providerProfile: {
        select: {
          user: { select: { phone: true, publicId: true } },
        },
      },
    },
  });
}

export async function listRequestStatusHistories(requestId: bigint) {
  return prisma.serviceRequestStatusHistory.findMany({
    where: { serviceRequestId: requestId },
    orderBy: { id: "asc" },
    select: {
      actorAdminId: true,
      actorType: true,
      actorUserId: true,
      createdAt: true,
      fromStatus: true,
      id: true,
      reason: true,
      toStatus: true,
    },
  });
}

export async function listRequestProviderHistories(requestId: bigint) {
  return prisma.serviceRequestProviderHistory.findMany({
    where: { requestProvider: { serviceRequestId: requestId } },
    orderBy: { id: "asc" },
    select: {
      actorAdminId: true,
      actorType: true,
      actorUserId: true,
      createdAt: true,
      fromStatus: true,
      id: true,
      reason: true,
      serviceRequestProviderId: true,
      toStatus: true,
    },
  });
}

export async function findProviderLinkById(linkId: bigint) {
  return prisma.serviceRequestProvider.findUnique({
    where: { id: linkId },
    select: {
      id: true,
      serviceRequestId: true,
      status: true,
      request: {
        select: {
          publicId: true,
          status: true,
        },
      },
    },
  });
}

export async function lockProviderLinkById(
  transaction: TransactionClient,
  linkId: bigint,
) {
  const rows = await transaction.$queryRaw<
    Array<{
      id: bigint;
      requestPublicId: string;
      requestStatus: string;
      serviceRequestId: bigint;
      status: string;
    }>
  >`
    SELECT srp.id,
           srp.service_request_id AS serviceRequestId,
           srp.status,
           sr.public_id AS requestPublicId,
           sr.status AS requestStatus
    FROM service_request_providers srp
    INNER JOIN service_requests sr ON sr.id = srp.service_request_id
    WHERE srp.id = ${linkId}
    LIMIT 1
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function removeProviderLinkByAdmin(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    fromStatus: "sent";
    linkId: bigint;
    now: Date;
    reason?: string | null;
  },
) {
  const updated = await transaction.serviceRequestProvider.updateMany({
    where: {
      id: input.linkId,
      status: input.fromStatus,
    },
    data: {
      removedReason: "admin_removed",
      status: "removed",
      updatedAt: input.now,
    },
  });

  if (updated.count !== 1) {
    return { ok: false as const };
  }

  await transaction.serviceRequestProviderHistory.create({
    data: {
      actorAdminId: input.adminId,
      actorType: "admin",
      fromStatus: input.fromStatus,
      reason: input.reason ?? "admin_removed",
      serviceRequestProviderId: input.linkId,
      toStatus: "removed",
    },
  });

  return { ok: true as const };
}
