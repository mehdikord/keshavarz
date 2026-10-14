function decimalToString(
  value: { toString(): string } | string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : value.toString();
}

export interface AdminProviderListRecord {
  approvedAt: Date | null;
  bio: string | null;
  createdAt: Date;
  isActive: number;
  isAvailable: number;
  user: {
    image: string | null;
    name: string;
    phone: string;
    publicId: string;
  };
  workRadiusKm: number;
}

export interface AdminProviderDetailRecord extends AdminProviderListRecord {
  updatedAt: Date;
  workLatitude: { toString(): string } | string | null;
  workLongitude: { toString(): string } | string | null;
  _count: { providerServices: number };
}

export interface AdminProviderServiceRecord {
  description: string | null;
  id: bigint;
  isActive: number;
  priceToman: bigint;
  pricingUnit: string;
  service: { name: string; slug: string };
  updatedAt: Date;
}

export function mapAdminProviderListItem(profile: AdminProviderListRecord) {
  return {
    approved: Boolean(profile.approvedAt),
    approvedAt: profile.approvedAt?.toISOString() ?? null,
    bio: profile.bio,
    createdAt: profile.createdAt.toISOString(),
    isActive: profile.isActive === 1,
    isAvailable: profile.isAvailable === 1,
    name: profile.user.name,
    phone: profile.user.phone,
    providerId: profile.user.publicId,
    userImage: profile.user.image,
    workRadiusKm: profile.workRadiusKm,
  };
}

export function mapAdminProviderDetail(
  profile: AdminProviderDetailRecord,
  activeSubscription: {
    amountToman: bigint;
    endsAt: Date | null;
    planNameSnapshot: string;
    publicId: string;
    source: string;
    startsAt: Date | null;
    status: string;
  } | null,
) {
  return {
    ...mapAdminProviderListItem(profile),
    activeSubscription: activeSubscription
      ? {
          amountToman: Number(activeSubscription.amountToman),
          endsAt: activeSubscription.endsAt?.toISOString() ?? null,
          planName: activeSubscription.planNameSnapshot,
          source: activeSubscription.source,
          startsAt: activeSubscription.startsAt?.toISOString() ?? null,
          status: activeSubscription.status,
          subscriptionId: activeSubscription.publicId,
        }
      : null,
    servicesCount: profile._count.providerServices,
    updatedAt: profile.updatedAt.toISOString(),
    user: {
      image: profile.user.image,
      name: profile.user.name,
      phone: profile.user.phone,
      userId: profile.user.publicId,
    },
    workArea: {
      workLatitude: decimalToString(profile.workLatitude),
      workLongitude: decimalToString(profile.workLongitude),
      workRadiusKm: profile.workRadiusKm,
    },
  };
}

export function mapAdminProviderService(service: AdminProviderServiceRecord) {
  return {
    description: service.description,
    isActive: service.isActive === 1,
    priceToman: Number(service.priceToman),
    pricingUnit: service.pricingUnit,
    providerServiceId: service.id.toString(),
    serviceId: service.service.slug,
    serviceName: service.service.name,
    updatedAt: service.updatedAt.toISOString(),
  };
}
