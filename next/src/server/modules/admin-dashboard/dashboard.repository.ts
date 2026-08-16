import { prisma } from "@/server/db/prisma";

export async function countUsers(input: {
  activeOnly?: boolean;
  deletedAtNull?: boolean;
}): Promise<number> {
  return prisma.user.count({
    where: {
      ...(input.deletedAtNull === false ? {} : { deletedAt: null }),
      ...(input.activeOnly ? { isActive: 1 } : {}),
    },
  });
}

export async function countActiveUsersInRange(input: {
  from: Date;
  to: Date;
}): Promise<number> {
  return prisma.user.count({
    where: {
      deletedAt: null,
      lastLoginAt: {
        gte: input.from,
        lte: input.to,
      },
    },
  });
}

export async function countProviders(input: {
  approvedOnly?: boolean;
  availableOnly?: boolean;
}): Promise<number> {
  return prisma.providerProfile.count({
    where: {
      ...(input.approvedOnly ? { approvedAt: { not: null } } : {}),
      ...(input.availableOnly
        ? { approvedAt: { not: null }, isActive: 1, isAvailable: 1 }
        : {}),
    },
  });
}

export async function countRequestsByStatus(input: {
  from: Date;
  to: Date;
}) {
  return prisma.serviceRequest.groupBy({
    by: ["status"],
    where: {
      createdAt: {
        gte: input.from,
        lte: input.to,
      },
    },
    _count: { _all: true },
    orderBy: { status: "asc" },
  });
}

export async function sumPaidSubscriptionRevenue(input: {
  from: Date;
  to: Date;
}): Promise<bigint> {
  const result = await prisma.subscriptionPayment.aggregate({
    where: {
      paidAt: {
        gte: input.from,
        lte: input.to,
      },
      status: "paid",
    },
    _sum: { amountToman: true },
  });
  return result._sum.amountToman ?? BigInt(0);
}

export async function countPaymentFailures(input: {
  from: Date;
  to: Date;
}): Promise<number> {
  return prisma.subscriptionPayment.count({
    where: {
      OR: [
        {
          failedAt: {
            gte: input.from,
            lte: input.to,
          },
        },
        {
          createdAt: {
            gte: input.from,
            lte: input.to,
          },
          failedAt: null,
          status: "failed",
        },
      ],
      status: "failed",
    },
  });
}

export async function countNotificationDeliveryFailures(input: {
  from: Date;
  to: Date;
}): Promise<number> {
  return prisma.notificationDelivery.count({
    where: {
      OR: [
        {
          failedAt: {
            gte: input.from,
            lte: input.to,
          },
        },
        {
          createdAt: {
            gte: input.from,
            lte: input.to,
          },
          failedAt: null,
          status: "failed",
        },
      ],
      status: "failed",
    },
  });
}
