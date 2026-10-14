import type { TransactionClient } from "@/server/db/transaction";
import { prisma } from "@/server/db/prisma";

const categorySelect = {
  createdAt: true,
  deletedAt: true,
  description: true,
  icon: true,
  id: true,
  image: true,
  isActive: true,
  name: true,
  slug: true,
  sortOrder: true,
  updatedAt: true,
} as const;

const serviceSelect = {
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  createdAt: true,
  deletedAt: true,
  description: true,
  id: true,
  image: true,
  isActive: true,
  name: true,
  slug: true,
  sortOrder: true,
  updatedAt: true,
} as const;

export async function listAdminCategories(input: { isActive?: 0 | 1 }) {
  return prisma.serviceCategory.findMany({
    where: {
      deletedAt: null,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: categorySelect,
  });
}

export async function findAdminCategoryBySlug(slug: string) {
  return prisma.serviceCategory.findFirst({
    where: { deletedAt: null, slug },
    select: categorySelect,
  });
}

export async function createAdminCategory(input: {
  adminId: bigint;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  isActive: boolean;
  name: string;
  slug: string;
  sortOrder: number;
}) {
  return prisma.serviceCategory.create({
    data: {
      createdByAdminId: input.adminId,
      description: input.description ?? null,
      icon: input.icon ?? null,
      image: input.image ?? null,
      isActive: input.isActive ? 1 : 0,
      name: input.name,
      slug: input.slug,
      sortOrder: input.sortOrder,
      updatedByAdminId: input.adminId,
    },
    select: categorySelect,
  });
}

export async function updateAdminCategory(
  categoryId: bigint,
  adminId: bigint,
  data: {
    description?: string | null;
    icon?: string | null;
    image?: string | null;
    isActive?: number;
    name?: string;
    slug?: string;
    sortOrder?: number;
  },
) {
  return prisma.serviceCategory.update({
    where: { id: categoryId },
    data: {
      ...data,
      updatedByAdminId: adminId,
    },
    select: categorySelect,
  });
}

export async function softDeleteAdminCategory(
  categoryId: bigint,
  adminId: bigint,
  now: Date,
) {
  return prisma.serviceCategory.update({
    where: { id: categoryId },
    data: {
      deletedAt: now,
      updatedByAdminId: adminId,
    },
    select: categorySelect,
  });
}

export async function countNonDeletedServicesInCategory(
  categoryId: bigint,
): Promise<number> {
  return prisma.service.count({
    where: {
      deletedAt: null,
      serviceCategoryId: categoryId,
    },
  });
}

export async function countProviderServicesForCategory(
  categoryId: bigint,
): Promise<number> {
  return prisma.providerService.count({
    where: {
      service: { serviceCategoryId: categoryId },
    },
  });
}

export async function countServiceRequestsForCategory(
  categoryId: bigint,
): Promise<number> {
  return prisma.serviceRequest.count({
    where: {
      service: { serviceCategoryId: categoryId },
    },
  });
}

export async function listAdminServices(input: {
  categoryId?: bigint;
  isActive?: 0 | 1;
}) {
  return prisma.service.findMany({
    where: {
      deletedAt: null,
      ...(input.categoryId === undefined
        ? {}
        : { serviceCategoryId: input.categoryId }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: serviceSelect,
  });
}

export async function findAdminServiceBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { deletedAt: null, slug },
    select: serviceSelect,
  });
}

export async function createAdminService(input: {
  adminId: bigint;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  name: string;
  serviceCategoryId: bigint;
  slug: string;
  sortOrder: number;
}) {
  return prisma.service.create({
    data: {
      createdByAdminId: input.adminId,
      description: input.description ?? null,
      image: input.image ?? null,
      isActive: input.isActive ? 1 : 0,
      name: input.name,
      serviceCategoryId: input.serviceCategoryId,
      slug: input.slug,
      sortOrder: input.sortOrder,
      updatedByAdminId: input.adminId,
    },
    select: serviceSelect,
  });
}

export async function updateAdminService(
  serviceId: bigint,
  adminId: bigint,
  data: {
    description?: string | null;
    image?: string | null;
    isActive?: number;
    name?: string;
    serviceCategoryId?: bigint;
    slug?: string;
    sortOrder?: number;
  },
) {
  return prisma.service.update({
    where: { id: serviceId },
    data: {
      ...data,
      updatedByAdminId: adminId,
    },
    select: serviceSelect,
  });
}

export async function softDeleteAdminService(
  serviceId: bigint,
  adminId: bigint,
  now: Date,
) {
  return prisma.service.update({
    where: { id: serviceId },
    data: {
      deletedAt: now,
      updatedByAdminId: adminId,
    },
    select: serviceSelect,
  });
}

export async function countProviderServicesForService(
  serviceId: bigint,
): Promise<number> {
  return prisma.providerService.count({
    where: { serviceId },
  });
}

export async function countServiceRequestsForService(
  serviceId: bigint,
): Promise<number> {
  return prisma.serviceRequest.count({
    where: { serviceId },
  });
}

export type ReorderCatalogResult =
  | { kind: "ok" }
  | { kind: "missing_category"; categoryId: string }
  | { kind: "missing_service"; serviceId: string };

export async function reorderAdminCatalog(
  transaction: TransactionClient,
  input: {
    adminId: bigint;
    categories?: Array<{ categoryId: string; sortOrder: number }>;
    services?: Array<{ serviceId: string; sortOrder: number }>;
  },
): Promise<ReorderCatalogResult> {
  if (input.categories) {
    for (const item of input.categories) {
      const updated = await transaction.serviceCategory.updateMany({
        where: { deletedAt: null, slug: item.categoryId },
        data: {
          sortOrder: item.sortOrder,
          updatedByAdminId: input.adminId,
        },
      });
      if (updated.count === 0) {
        return { kind: "missing_category", categoryId: item.categoryId };
      }
    }
  }

  if (input.services) {
    for (const item of input.services) {
      const updated = await transaction.service.updateMany({
        where: { deletedAt: null, slug: item.serviceId },
        data: {
          sortOrder: item.sortOrder,
          updatedByAdminId: input.adminId,
        },
      });
      if (updated.count === 0) {
        return { kind: "missing_service", serviceId: item.serviceId };
      }
    }
  }

  return { kind: "ok" };
}
