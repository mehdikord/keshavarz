export interface AdminUserListRecord {
  createdAt: Date;
  image: string | null;
  isActive: number;
  lastLoginAt: Date | null;
  name: string;
  phone: string;
  publicId: string;
}

export interface AdminUserDetailRecord extends AdminUserListRecord {
  deletedAt: Date | null;
  locale: string;
  phoneVerifiedAt: Date | null;
  providerProfile: {
    approvedAt: Date | null;
    isActive: number;
    isAvailable: number;
  } | null;
  timezone: string;
  updatedAt: Date;
}

export interface AdminModerationActionRecord {
  action: string;
  admin: { publicId: string };
  createdAt: Date;
  endsAt: Date | null;
  id: bigint;
  reason: string;
  startsAt: Date;
}

export function mapAdminUserListItem(user: AdminUserListRecord) {
  return {
    createdAt: user.createdAt.toISOString(),
    image: user.image,
    isActive: user.isActive === 1,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    name: user.name,
    phone: user.phone,
    userId: user.publicId,
  };
}

export function mapAdminUserDetail(user: AdminUserDetailRecord) {
  const provider = user.providerProfile;
  return {
    ...mapAdminUserListItem(user),
    deletedAt: user.deletedAt?.toISOString() ?? null,
    locale: user.locale,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    providerProfile: provider
      ? {
          active: provider.isActive === 1,
          approved: Boolean(provider.approvedAt),
          approvedAt: provider.approvedAt?.toISOString() ?? null,
          available: provider.isAvailable === 1,
        }
      : null,
    timezone: user.timezone,
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function mapAdminModerationAction(item: AdminModerationActionRecord) {
  return {
    action: item.action,
    adminId: item.admin.publicId,
    createdAt: item.createdAt.toISOString(),
    endsAt: item.endsAt?.toISOString() ?? null,
    moderationActionId: item.id.toString(),
    reason: item.reason,
    startsAt: item.startsAt.toISOString(),
  };
}
