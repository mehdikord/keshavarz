import { AdminAuditLogDetailPage } from "@/components/admin-panel/audit/admin-audit-log-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ auditLogId: string }>;
}) {
  const { auditLogId } = await params;
  return <AdminAuditLogDetailPage auditLogId={auditLogId} />;
}
