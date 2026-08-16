import { AdminUserDetailPage } from "@/components/admin-panel/users/admin-user-detail-page";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailRoutePage({ params }: PageProps) {
  const { userId } = await params;
  return <AdminUserDetailPage userId={userId} />;
}
