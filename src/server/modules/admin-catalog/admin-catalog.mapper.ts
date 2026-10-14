export interface AdminCategoryRecord {
  createdAt: Date;
  deletedAt: Date | null;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: number;
  name: string;
  slug: string;
  sortOrder: number;
  updatedAt: Date;
}

export interface AdminServiceRecord {
  category: { name: string; slug: string };
  createdAt: Date;
  deletedAt: Date | null;
  description: string | null;
  image: string | null;
  isActive: number;
  name: string;
  slug: string;
  sortOrder: number;
  updatedAt: Date;
}

export function mapAdminCategory(category: AdminCategoryRecord) {
  return {
    categoryId: category.slug,
    createdAt: category.createdAt.toISOString(),
    deletedAt: category.deletedAt?.toISOString() ?? null,
    description: category.description,
    icon: category.icon,
    image: category.image,
    isActive: category.isActive === 1,
    name: category.name,
    sortOrder: category.sortOrder,
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function mapAdminService(service: AdminServiceRecord) {
  return {
    category: {
      categoryId: service.category.slug,
      name: service.category.name,
    },
    createdAt: service.createdAt.toISOString(),
    deletedAt: service.deletedAt?.toISOString() ?? null,
    description: service.description,
    image: service.image,
    isActive: service.isActive === 1,
    name: service.name,
    serviceId: service.slug,
    sortOrder: service.sortOrder,
    updatedAt: service.updatedAt.toISOString(),
  };
}
