import { AdminRoleDetailPage } from "@/components/admin-panel/rbac/admin-role-detail-page";

interface PageProps {
  params: Promise<{ roleId: string }>;
}

export default async function AdminRoleDetailRoutePage({ params }: PageProps) {
  const { roleId } = await params;
  return <AdminRoleDetailPage roleId={roleId} />;
}
