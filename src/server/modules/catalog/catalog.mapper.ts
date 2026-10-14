export function mapCategory(category: {
  description: string | null;
  icon: string | null;
  image: string | null;
  name: string;
  slug: string;
  sortOrder: number;
}) {
  return {
    categoryId: category.slug,
    description: category.description,
    icon: category.icon,
    image: category.image,
    name: category.name,
    sortOrder: category.sortOrder,
  };
}

export function mapService(service: {
  description: string | null;
  image: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  category?: { name: string; slug: string };
}) {
  return {
    category: service.category
      ? {
          categoryId: service.category.slug,
          name: service.category.name,
        }
      : undefined,
    description: service.description,
    image: service.image,
    name: service.name,
    serviceId: service.slug,
    sortOrder: service.sortOrder,
  };
}
