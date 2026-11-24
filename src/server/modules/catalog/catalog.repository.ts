import { prisma } from "@/server/db/prisma";

export async function listActiveCategories() {
  return prisma.serviceCategory.findMany({
    where: { deletedAt: null, isActive: 1 },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      description: true,
      icon: true,
      image: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
  });
}

export async function findActiveCategoryBySlug(slug: string) {
  return prisma.serviceCategory.findFirst({
    where: { deletedAt: null, isActive: 1, slug },
    select: { id: true, name: true, slug: true },
  });
}

export async function listActiveServicesByCategoryId(categoryId: bigint) {
  return prisma.service.findMany({
    where: {
      deletedAt: null,
      isActive: 1,
      serviceCategoryId: categoryId,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      description: true,
      image: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
  });
}

export async function findActiveServiceBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { deletedAt: null, isActive: 1, slug },
    select: {
      category: {
        select: {
          name: true,
          slug: true,
        },
      },
      description: true,
      id: true,
      image: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
  });
}

/** A service and its category must both be live and active to be shown. */
const VISIBLE_SERVICE = {
  category: { deletedAt: null, isActive: 1 },
  deletedAt: null,
  isActive: 1,
} as const;

export async function listVisibleSpecialServices() {
  return prisma.service.findMany({
    where: { ...VISIBLE_SERVICE, isSpecial: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      category: { select: { name: true, slug: true } },
      description: true,
      image: true,
      name: true,
      slug: true,
    },
  });
}

export async function findVisibleServiceIntroBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { ...VISIBLE_SERVICE, slug },
    select: {
      category: { select: { image: true, name: true, slug: true } },
      description: true,
      details: true,
      image: true,
      isSpecial: true,
      name: true,
      slug: true,
      updatedAt: true,
    },
  });
}

/** Other visible services of the same category, for "more like this". */
export async function listVisibleSiblingServices(categorySlug: string, exceptSlug: string, take: number) {
  return prisma.service.findMany({
    where: { ...VISIBLE_SERVICE, category: { ...VISIBLE_SERVICE.category, slug: categorySlug }, slug: { not: exceptSlug } },
    orderBy: [{ isSpecial: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    select: { image: true, name: true, slug: true },
    take,
  });
}
