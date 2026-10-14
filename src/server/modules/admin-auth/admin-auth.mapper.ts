export interface AdminProfileRecord {
  email: string | null;
  image: string | null;
  isSuperAdmin: number;
  name: string;
  phone: string;
  publicId: string;
}

export function mapAdminProfile(
  profile: AdminProfileRecord,
  permissions: readonly string[] = [],
) {
  return {
    adminId: profile.publicId,
    email: profile.email,
    image: profile.image,
    isSuperAdmin: profile.isSuperAdmin === 1,
    name: profile.name,
    permissions: [...permissions],
    phone: profile.phone,
  };
}
