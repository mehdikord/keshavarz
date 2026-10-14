import { prisma } from "@/server/db/prisma";

const profileSelect = {
  city: {
    select: {
      id: true,
      name: true,
      provinceId: true,
    },
  },
  image: true,
  locale: true,
  name: true,
  phone: true,
  province: {
    select: {
      id: true,
      name: true,
    },
  },
  providerProfile: {
    select: {
      approvedAt: true,
      isActive: true,
      isAvailable: true,
    },
  },
  publicId: true,
  timezone: true,
} as const;

export async function getCurrentUserProfile(userId: bigint) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
}

export async function updateCurrentUserProfile(
  userId: bigint,
  data: {
    cityId?: bigint | null;
    locale?: string;
    name?: string;
    provinceId?: bigint | null;
    timezone?: string;
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
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
