import { AdminProviderDetailPage } from "@/components/admin-panel/providers/admin-provider-detail-page";

interface PageProps {
  params: Promise<{ providerId: string }>;
}

export default async function AdminProviderDetailRoutePage({
  params,
}: PageProps) {
  const { providerId } = await params;
  return <AdminProviderDetailPage providerId={providerId} />;
}
