import { prisma } from "@/server/db/prisma";

export async function listActiveProvinces() {
  return prisma.province.findMany({
    where: { deletedAt: null },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });
}

export async function listActiveCitiesByProvinceId(provinceId: bigint) {
  return prisma.city.findMany({
    where: { deletedAt: null, provinceId },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
    },
  });
}

export async function findActiveProvinceById(provinceId: bigint) {
  return prisma.province.findFirst({
    where: { id: provinceId, deletedAt: null },
    select: { id: true, name: true },
  });
}

export async function findActiveCityById(cityId: bigint) {
  return prisma.city.findFirst({
    where: { id: cityId, deletedAt: null },
    select: { id: true, provinceId: true, name: true },
  });
}
