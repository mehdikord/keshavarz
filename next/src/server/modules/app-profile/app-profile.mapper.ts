export interface ProfileRecord {
  image: string | null;
  locale: string;
  name: string;
  phone: string;
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
    image: profile.image,
    locale: profile.locale,
    name: profile.name,
    phone: profile.phone,
    timezone: profile.timezone,
    userId: profile.publicId,
  };
}
