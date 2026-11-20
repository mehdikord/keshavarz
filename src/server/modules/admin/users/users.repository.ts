import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import type { TransactionClient } from "@/server/db/transaction";
import type { UserStatus } from "@/server/modules/admin/users/users.schemas";

const RESTRICTIONS = ["ban", "suspend"] as const;

function activeRestrictionWhere(now: Date, actions: ReadonlyArray<"ban" | "suspend"> = RESTRICTIONS) {
  return {
    action: { in: [...actions] },
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  } satisfies Prisma.UserModerationActionWhereInput;
}

export interface UserListFilters {
  provinceId?: number;
  q?: string;
  role: "all" | "consumer" | "provider";
  status: "all" | UserStatus;
}

function statusWhere(status: UserListFilters["status"], now: Date): Prisma.UserWhereInput {
  const anyRestriction = activeRestrictionWhere(now);
  switch (status) {
    case "deleted":
      return { deletedAt: { not: null } };
    case "banned":
      return {
        deletedAt: null,
        userModerationActions: { some: activeRestrictionWhere(now, ["ban"]) },
      };
    case "suspended":
      return {
        deletedAt: null,
        AND: [
          { userModerationActions: { some: activeRestrictionWhere(now, ["suspend"]) } },
          { userModerationActions: { none: activeRestrictionWhere(now, ["ban"]) } },
        ],
      };
    case "inactive":
      return { deletedAt: null, isActive: 0, userModerationActions: { none: anyRestriction } };
    case "active":
      return { deletedAt: null, isActive: 1, userModerationActions: { none: anyRestriction } };
    default:
      return { deletedAt: null };
  }
}

function buildUserWhere(filters: UserListFilters, now: Date): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [statusWhere(filters.status, now)];

  if (filters.role === "provider") and.push({ providerProfile: { isNot: null } });
  if (filters.role === "consumer") and.push({ providerProfile: { is: null } });
  if (filters.provinceId) and.push({ provinceId: BigInt(filters.provinceId) });

  const q = filters.q?.trim();
  if (q) {
    const or: Prisma.UserWhereInput[] = [{ name: { contains: q } }];
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    if (/^[0-9A-Za-z]{26}$/.test(q)) or.push({ publicId: q.toUpperCase() });
    and.push({ OR: or });
  }

  return { AND: and };
}

const SORTS: Record<string, Prisma.UserOrderByWithRelationInput[]> = {
  name: [{ name: "asc" }, { id: "desc" }],
  newest: [{ id: "desc" }],
  oldest: [{ id: "asc" }],
  recent_login: [{ lastLoginAt: { nulls: "last", sort: "desc" } }, { id: "desc" }],
};

export async function listUsers(input: {
  filters: UserListFilters;
  now: Date;
  skip: number;
  sort: string;
  take: number;
}) {
  const where = buildUserWhere(input.filters, input.now);
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: SORTS[input.sort] ?? SORTS.newest,
      skip: input.skip,
      take: input.take,
      select: {
        _count: {
          select: {
            consumerRequests: true,
            lands: { where: { deletedAt: null } },
          },
        },
        city: { select: { name: true } },
        createdAt: true,
        deletedAt: true,
        image: true,
        isActive: true,
        lastLoginAt: true,
        name: true,
        phone: true,
        providerProfile: { select: { approvedAt: true, isActive: true } },
        province: { select: { name: true } },
        publicId: true,
        userModerationActions: {
          where: activeRestrictionWhere(input.now),
          orderBy: { id: "desc" },
          select: { action: true, endsAt: true },
          take: 2,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { rows, total };
}

/** Per-status totals for the list tabs, honouring every other active filter. */
export async function countUsersPerStatus(
  filters: Omit<UserListFilters, "status">,
  now: Date,
): Promise<Record<"all" | UserStatus, number>> {
  const statuses = ["all", "active", "inactive", "suspended", "banned", "deleted"] as const;
  const counts = await Promise.all(
    statuses.map((status) => prisma.user.count({ where: buildUserWhere({ ...filters, status }, now) })),
  );
  return Object.fromEntries(statuses.map((status, index) => [status, counts[index] ?? 0])) as Record<
    "all" | UserStatus,
    number
  >;
}

export async function listProvinceOptions() {
  return prisma.province.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function findLocationNames(provinceIds: bigint[], cityIds: bigint[]) {
  const [provinces, cities] = await Promise.all([
    provinceIds.length
      ? prisma.province.findMany({ where: { id: { in: provinceIds } }, select: { id: true, name: true } })
      : [],
    cityIds.length ? prisma.city.findMany({ where: { id: { in: cityIds } }, select: { id: true, name: true } }) : [],
  ]);
  return {
    cities: new Map(cities.map((city) => [city.id.toString(), city.name])),
    provinces: new Map(provinces.map((province) => [province.id.toString(), province.name])),
  };
}

export async function findUserCore(publicId: string, now: Date) {
  return prisma.user.findUnique({
    where: { publicId },
    select: {
      city: { select: { id: true, name: true } },
      createdAt: true,
      deletedAt: true,
      id: true,
      image: true,
      isActive: true,
      lastLoginAt: true,
      lastLoginIp: true,
      locale: true,
      name: true,
      phone: true,
      phoneVerifiedAt: true,
      providerProfile: {
        select: { approvedAt: true, id: true, isActive: true, isAvailable: true },
      },
      province: { select: { id: true, name: true } },
      publicId: true,
      timezone: true,
      updatedAt: true,
      userModerationActions: {
        where: activeRestrictionWhere(now),
        orderBy: { id: "desc" },
        select: {
          action: true,
          admin: { select: { name: true } },
          endsAt: true,
          reason: true,
          startsAt: true,
        },
        take: 2,
      },
    },
  });
}

export async function findUserIdentity(publicId: string) {
  return prisma.user.findUnique({
    where: { publicId },
    select: {
      cityId: true,
      deletedAt: true,
      id: true,
      isActive: true,
      name: true,
      phone: true,
      provinceId: true,
    },
  });
}

export async function loadUserCounters(userId: bigint, now: Date) {
  const [lands, requestsByStatus, spent, paid, activeSessions, unreadNotifications, notes] =
    await Promise.all([
      prisma.land.aggregate({
        _count: { _all: true },
        _sum: { areaSquareMeters: true },
        where: { deletedAt: null, userId },
      }),
      prisma.serviceRequest.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { consumerUserId: userId },
      }),
      prisma.serviceRequest.aggregate({
        _sum: { agreedPriceToman: true },
        where: { consumerUserId: userId, status: "completed" },
      }),
      prisma.subscriptionPayment.aggregate({
        _sum: { amountToman: true },
        where: { status: { in: ["paid", "partially_refunded"] }, userId },
      }),
      prisma.userSession.count({
        where: { expiresAt: { gt: now }, revokedAt: null, userId },
      }),
      prisma.notification.count({ where: { readAt: null, userId } }),
      prisma.userAdminNote.count({ where: { deletedAt: null, userId } }),
    ]);

  return {
    activeSessions,
    landArea: Number(lands._sum.areaSquareMeters ?? 0),
    landsCount: lands._count._all,
    notes,
    paidTotal: paid._sum.amountToman ?? BigInt(0),
    requestsByStatus: requestsByStatus.map((row) => ({ count: row._count._all, status: row.status })),
    spentTotal: spent._sum.agreedPriceToman ?? BigInt(0),
    unreadNotifications,
  };
}

export async function loadRecentActivity(userId: bigint, limit: number) {
  const [requests, lands, payments, moderation, sessions] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { consumerUserId: userId },
      orderBy: { id: "desc" },
      take: limit,
      select: { createdAt: true, publicId: true, serviceNameSnapshot: true, status: true },
    }),
    prisma.land.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: limit,
      select: { createdAt: true, publicId: true, title: true },
    }),
    prisma.subscriptionPayment.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: limit,
      select: { amountToman: true, createdAt: true, publicId: true, status: true },
    }),
    prisma.userModerationAction.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: limit,
      select: { action: true, admin: { select: { name: true } }, createdAt: true, id: true, reason: true },
    }),
    prisma.userSession.findMany({
      where: { userId },
      orderBy: { id: "desc" },
      take: limit,
      select: { createdAt: true, deviceName: true, id: true, platform: true },
    }),
  ]);
  return { lands, moderation, payments, requests, sessions };
}

export async function listUserNotes(userId: bigint) {
  return prisma.userAdminNote.findMany({
    where: { deletedAt: null, userId },
    orderBy: [{ isPinned: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      admin: { select: { name: true, publicId: true } },
      body: true,
      createdAt: true,
      isPinned: true,
      publicId: true,
    },
  });
}

export async function listUserLands(userId: bigint) {
  return prisma.land.findMany({
    where: { userId },
    orderBy: [{ deletedAt: { nulls: "first", sort: "asc" } }, { id: "desc" }],
    select: {
      _count: { select: { serviceRequests: true } },
      areaSquareMeters: true,
      createdAt: true,
      deletedAt: true,
      description: true,
      isActive: true,
      latitude: true,
      longitude: true,
      publicId: true,
      title: true,
    },
  });
}

export async function listUserRequests(input: {
  skip: number;
  status: string;
  take: number;
  userId: bigint;
}) {
  const where: Prisma.ServiceRequestWhereInput = {
    consumerUserId: input.userId,
    ...(input.status !== "all" ? { status: input.status as Prisma.EnumServiceRequestStatusFilter["equals"] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      orderBy: { id: "desc" },
      skip: input.skip,
      take: input.take,
      select: {
        _count: { select: { serviceRequestProviders: true } },
        agreedPriceToman: true,
        assignedProviderNameSnapshot: true,
        cancelReason: true,
        cancelledBy: true,
        completedAt: true,
        createdAt: true,
        landTitleSnapshot: true,
        publicId: true,
        serviceCategoryNameSnapshot: true,
        serviceNameSnapshot: true,
        serviceRequestDates: { orderBy: { sortOrder: "asc" }, select: { scheduledDate: true } },
        status: true,
      },
    }),
    prisma.serviceRequest.count({ where }),
  ]);
  return { rows, total };
}

export async function loadProviderDetail(userId: bigint) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
    select: {
      _count: { select: { galleryImages: true } },
      approvedAt: true,
      approvedByAdmin: { select: { name: true } },
      bio: true,
      createdAt: true,
      id: true,
      isActive: true,
      isAvailable: true,
      providerServices: {
        orderBy: [{ isActive: "desc" }, { id: "asc" }],
        select: {
          description: true,
          isActive: true,
          priceToman: true,
          pricingUnit: true,
          service: { select: { category: { select: { name: true } }, name: true } },
          updatedAt: true,
        },
      },
      providerSubscriptions: {
        orderBy: { id: "desc" },
        take: 20,
        select: {
          amountToman: true,
          cancellationReason: true,
          endsAt: true,
          grantedByAdmin: { select: { name: true } },
          planNameSnapshot: true,
          publicId: true,
          source: true,
          startsAt: true,
          status: true,
        },
      },
      workLatitude: true,
      workLongitude: true,
      workRadiusKm: true,
    },
  });

  if (!profile) return null;

  const [inbox, jobs, revenue, recentJobs] = await Promise.all([
    prisma.serviceRequestProvider.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { providerProfileId: profile.id },
    }),
    prisma.serviceRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { assignedProviderProfileId: profile.id },
    }),
    prisma.serviceRequest.aggregate({
      _sum: { agreedPriceToman: true },
      where: { assignedProviderProfileId: profile.id, status: "completed" },
    }),
    prisma.serviceRequest.findMany({
      where: { assignedProviderProfileId: profile.id },
      orderBy: { id: "desc" },
      take: 10,
      select: {
        agreedPriceToman: true,
        consumer: { select: { publicId: true } },
        consumerNameSnapshot: true,
        createdAt: true,
        publicId: true,
        serviceNameSnapshot: true,
        status: true,
      },
    }),
  ]);

  return {
    inbox: inbox.map((row) => ({ count: row._count._all, status: row.status })),
    jobs: jobs.map((row) => ({ count: row._count._all, status: row.status })),
    profile,
    recentJobs,
    revenue: revenue._sum.agreedPriceToman ?? BigInt(0),
  };
}

export async function listUserPayments(userId: bigint) {
  return prisma.subscriptionPayment.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 100,
    select: {
      amountToman: true,
      authority: true,
      createdAt: true,
      failureMessage: true,
      gateway: true,
      paidAt: true,
      paymentRefunds: {
        orderBy: { id: "desc" },
        select: { amountToman: true, createdAt: true, reason: true, status: true },
      },
      publicId: true,
      status: true,
      subscription: { select: { planNameSnapshot: true } },
      transactionReference: true,
    },
  });
}

export async function listUserSessions(userId: bigint) {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: [{ revokedAt: { nulls: "first", sort: "desc" } }, { lastActivityAt: "desc" }],
    take: 50,
    select: {
      createdAt: true,
      deviceName: true,
      expiresAt: true,
      ipAddress: true,
      lastActivityAt: true,
      platform: true,
      publicId: true,
      revokedAt: true,
      userAgent: true,
    },
  });
}

export async function listRecentOtpAttempts(phone: string) {
  return prisma.userOtpCode.findMany({
    where: { phone },
    orderBy: { id: "desc" },
    take: 15,
    select: {
      attemptsCount: true,
      consumedAt: true,
      createdAt: true,
      expiresAt: true,
      id: true,
      maxAttempts: true,
      purpose: true,
      requestedIp: true,
    },
  });
}

export async function listUserNotifications(userId: bigint) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 60,
    select: {
      body: true,
      createdAt: true,
      notificationDeliveries: { select: { channel: true, status: true } },
      publicId: true,
      readAt: true,
      title: true,
      type: true,
    },
  });
}

export async function listModerationHistory(userId: bigint) {
  return prisma.userModerationAction.findMany({
    where: { userId },
    orderBy: { id: "desc" },
    take: 100,
    select: {
      action: true,
      admin: { select: { name: true } },
      createdAt: true,
      endsAt: true,
      id: true,
      reason: true,
      startsAt: true,
    },
  });
}

// ---------------------------------------------------------------- mutations

export async function lockUserForUpdate(transaction: TransactionClient, userId: bigint) {
  await transaction.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

export async function findUserByPhone(transaction: TransactionClient, phone: string) {
  return transaction.user.findUnique({ where: { phone }, select: { id: true } });
}

export async function findCityProvince(transaction: TransactionClient, cityId: bigint) {
  return transaction.city.findFirst({
    where: { deletedAt: null, id: cityId },
    select: { provinceId: true },
  });
}

export async function provinceExists(transaction: TransactionClient, provinceId: bigint) {
  return (await transaction.province.count({ where: { deletedAt: null, id: provinceId } })) > 0;
}

export async function updateUserRow(
  transaction: TransactionClient,
  userId: bigint,
  data: Prisma.UserUncheckedUpdateInput,
) {
  await transaction.user.update({ where: { id: userId }, data });
}

export async function findActiveRestrictions(transaction: TransactionClient, userId: bigint, now: Date) {
  return transaction.userModerationAction.findMany({
    where: { userId, ...activeRestrictionWhere(now) },
    select: { action: true, id: true, startsAt: true },
  });
}

export async function endModerationAction(
  transaction: TransactionClient,
  id: bigint,
  endsAt: Date,
) {
  await transaction.userModerationAction.update({ where: { id }, data: { endsAt } });
}

export async function insertModerationAction(
  transaction: TransactionClient,
  data: {
    action: "activate" | "deactivate" | "suspend" | "ban" | "unban" | "warning";
    adminId: bigint;
    endsAt: Date | null;
    metadata?: Prisma.InputJsonValue;
    reason: string;
    startsAt: Date;
    userId: bigint;
  },
) {
  await transaction.userModerationAction.create({ data });
}

export async function revokeUserSessions(
  transaction: TransactionClient,
  input: { now: Date; sessionPublicId?: string; userId: bigint },
): Promise<number> {
  const result = await transaction.userSession.updateMany({
    where: {
      revokedAt: null,
      userId: input.userId,
      ...(input.sessionPublicId ? { publicId: input.sessionPublicId } : {}),
    },
    data: { revokedAt: input.now },
  });
  return result.count;
}

export async function insertUserNote(
  data: { adminId: bigint; body: string; isPinned: number; publicId: string; userId: bigint },
) {
  return prisma.userAdminNote.create({
    data,
    select: { publicId: true },
  });
}

export async function findUserNote(userId: bigint, notePublicId: string) {
  return prisma.userAdminNote.findFirst({
    where: { deletedAt: null, publicId: notePublicId, userId },
    select: { body: true, id: true, isPinned: true },
  });
}

export async function updateUserNote(id: bigint, data: Prisma.UserAdminNoteUpdateInput) {
  await prisma.userAdminNote.update({ where: { id }, data });
}
