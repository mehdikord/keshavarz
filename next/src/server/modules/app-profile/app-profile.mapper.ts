export interface ProfileRecord {
  city: {
    id: bigint;
    name: string;
    provinceId: bigint;
  } | null;
  image: string | null;
  locale: string;
  name: string;
  phone: string;
  province: {
    id: bigint;
    name: string;
  } | null;
  providerProfile: {
    approvedAt: Date | null;
    isActive: number;
    isAvailable: number;
  } | null;
  publicId: string;
  timezone: string;
}

export function mapCurrentUserProfile(profile: ProfileRecord) {
  const provider = profile.providerProfile;
  const province = profile.province;
  const city = profile.city;

  return {
    capabilities: {
      consumer: true,
      provider: provider
        ? {
            active: provider.isActive === 1,
            approved: Boolean(provider.approvedAt),
            available: provider.isAvailable === 1,
          }
        : null,
    },
    city: city
      ? {
          cityId: city.id.toString(),
          name: city.name,
          provinceId: city.provinceId.toString(),
        }
      : null,
    image: profile.image,
    locale: profile.locale,
    name: profile.name,
    phone: profile.phone,
    province: province
      ? {
          name: province.name,
          provinceId: province.id.toString(),
        }
      : null,
    timezone: profile.timezone,
    userId: profile.publicId,
  };
}
