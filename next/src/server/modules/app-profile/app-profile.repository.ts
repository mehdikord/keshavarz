import { prisma } from "@/server/db/prisma";

export async function getCurrentUserProfile(userId: bigint) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      image: true,
      locale: true,
      name: true,
      phone: true,
      providerProfile: {
        select: {
          approvedAt: true,
          isActive: true,
          isAvailable: true,
        },
      },
      publicId: true,
      timezone: true,
    },
  });
}

export async function updateCurrentUserProfile(
  userId: bigint,
  data: { locale?: string; name?: string; timezone?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      image: true,
      locale: true,
      name: true,
      phone: true,
      providerProfile: {
        select: {
          approvedAt: true,
          isActive: true,
          isAvailable: true,
        },
      },
      publicId: true,
      timezone: true,
    },
  });
}

export async function replaceCurrentUserImage(
  userId: bigint,
  image: string | null,
) {
  return prisma.user.update({
    where: { id: userId },
    data: { image },
    select: { image: true },
  });
}
