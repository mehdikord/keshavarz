function decimalToString(
  value: { toString(): string } | string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}

export function mapProviderProfile(
  profile: {
    approvedAt: Date | null;
    bio: string | null;
    isActive: number;
    isAvailable: number;
    workLatitude: { toString(): string } | string | null;
    workLongitude: { toString(): string } | string | null;
    workRadiusKm: number;
  },
  eligibility: {
    missing: string[];
    searchable: boolean;
  },
) {
  return {
    approved: Boolean(profile.approvedAt),
    approvedAt: profile.approvedAt?.toISOString() ?? null,
    bio: profile.bio,
    eligibility,
    isActive: profile.isActive === 1,
    isAvailable: profile.isAvailable === 1,
    workLatitude: decimalToString(profile.workLatitude),
    workLongitude: decimalToString(profile.workLongitude),
    workRadiusKm: profile.workRadiusKm,
  };
}

export function mapProviderService(service: {
  description: string | null;
  isActive: number;
  priceToman: bigint;
  pricingUnit: string;
  service: { name: string; slug: string };
  updatedAt: Date;
}) {
  return {
    description: service.description,
    isActive: service.isActive === 1,
    priceToman: Number(service.priceToman),
    pricingUnit: service.pricingUnit,
    providerServiceId: service.service.slug,
    serviceId: service.service.slug,
    serviceName: service.service.name,
    updatedAt: service.updatedAt.toISOString(),
  };
}

export function mapPublicProviderService(service: {
  description: string | null;
  priceToman: bigint;
  pricingUnit: string;
  service: {
    category: { name: string };
    image: string | null;
    name: string;
    slug: string;
  };
}) {
  return {
    categoryName: service.service.category.name,
    description: service.description,
    image: service.service.image,
    priceToman: Number(service.priceToman),
    pricingUnit: service.pricingUnit,
    serviceId: service.service.slug,
    serviceName: service.service.name,
  };
}

export function mapProviderGalleryImage(image: {
  caption: string | null;
  createdAt: Date;
  publicId: string;
  sortOrder: number;
  url: string;
}) {
  return {
    caption: image.caption,
    createdAt: image.createdAt.toISOString(),
    imageId: image.publicId,
    sortOrder: image.sortOrder,
    url: image.url,
  };
}

export function mapPublicProviderProfile(
  profile: {
    approvedAt: Date | null;
    bio: string | null;
    isAvailable: number;
    workRadiusKm: number;
    user: {
      city: { name: string } | null;
      image: string | null;
      name: string;
      province: { name: string } | null;
      publicId: string;
    };
  },
  services: ReturnType<typeof mapPublicProviderService>[],
  gallery: ReturnType<typeof mapProviderGalleryImage>[],
) {
  const cityName = profile.user.city?.name ?? null;
  const provinceName = profile.user.province?.name ?? null;

  return {
    approved: Boolean(profile.approvedAt),
    bio: profile.bio,
    gallery,
    image: profile.user.image,
    isAvailable: profile.isAvailable === 1,
    location:
      cityName || provinceName
        ? {
            cityName,
            provinceName,
          }
        : null,
    name: profile.user.name,
    providerId: profile.user.publicId,
    services,
    servicesCount: services.length,
    workRadiusKm: profile.workRadiusKm,
  };
}
