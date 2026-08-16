import { prisma } from "@/server/db/prisma";

const landSelect = {
  areaSquareMeters: true,
  createdAt: true,
  description: true,
  id: true,
  latitude: true,
  longitude: true,
  publicId: true,
  title: true,
  updatedAt: true,
} as const;

export async function listUserLands(input: {
  cursorId?: bigint;
  limit: number;
  userId: bigint;
}) {
  return prisma.land.findMany({
    where: {
      deletedAt: null,
      userId: input.userId,
      ...(input.cursorId ? { id: { lt: input.cursorId } } : {}),
    },
    orderBy: { id: "desc" },
    take: input.limit + 1,
    select: landSelect,
  });
}

export async function createUserLand(input: {
  areaSquareMeters: string;
  description?: string | null;
  latitude: string;
  longitude: string;
  publicId: string;
  title: string;
  userId: bigint;
}) {
  return prisma.land.create({
    data: {
      areaSquareMeters: input.areaSquareMeters,
      description: input.description ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      publicId: input.publicId,
      title: input.title,
      userId: input.userId,
    },
    select: landSelect,
  });
}

export async function findUserLandByPublicId(
  userId: bigint,
  publicId: string,
) {
  return prisma.land.findFirst({
    where: { deletedAt: null, publicId, userId },
    select: landSelect,
  });
}

export async function updateUserLand(
  landId: bigint,
  data: {
    areaSquareMeters?: string;
    description?: string | null;
    latitude?: string;
    longitude?: string;
    title?: string;
  },
) {
  return prisma.land.update({
    where: { id: landId },
    data,
    select: landSelect,
  });
}

export async function countLandServiceRequests(landId: bigint): Promise<number> {
  return prisma.serviceRequest.count({
    where: { landId },
  });
}

export async function softDeleteUserLand(
  landId: bigint,
  now: Date,
): Promise<void> {
  await prisma.land.update({
    where: { id: landId },
    data: {
      deletedAt: now,
      isActive: 0,
    },
  });
}
