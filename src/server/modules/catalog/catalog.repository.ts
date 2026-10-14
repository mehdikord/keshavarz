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
