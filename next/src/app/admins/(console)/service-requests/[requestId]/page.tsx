import { AdminServiceRequestDetailPage } from "@/components/admin-panel/requests/admin-service-request-detail-page";

interface PageProps {
  params: Promise<{ requestId: string }>;
}

export default async function AdminServiceRequestDetailRoutePage({
  params,
}: PageProps) {
  const { requestId } = await params;
  return <AdminServiceRequestDetailPage requestId={requestId} />;
}
