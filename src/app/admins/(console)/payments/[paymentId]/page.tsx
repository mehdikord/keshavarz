import { AdminPaymentDetailPage } from "@/components/admin-panel/payments/admin-payment-detail-page";

interface PageProps {
  params: Promise<{ paymentId: string }>;
}

export default async function AdminPaymentDetailRoutePage({
  params,
}: PageProps) {
  const { paymentId } = await params;
  return <AdminPaymentDetailPage paymentId={paymentId} />;
}
