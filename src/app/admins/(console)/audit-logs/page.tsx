import { Suspense } from "react";

import { AdminAuditLogsListPage } from "@/components/admin-panel/audit/admin-audit-logs-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminAuditLogsListPage />
    </Suspense>
  );
}
