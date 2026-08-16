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
