import { AdminAdminDetailPage } from "@/components/admin-panel/rbac/admin-admin-detail-page";

interface PageProps {
  params: Promise<{ adminId: string }>;
}

export default async function AdminAdminDetailRoutePage({ params }: PageProps) {
  const { adminId } = await params;
  return <AdminAdminDetailPage adminId={adminId} />;
}
