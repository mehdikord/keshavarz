import { Suspense } from "react";

import { AdminServiceRequestsListPage } from "@/components/admin-panel/requests/admin-service-requests-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function RequestsRouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminServiceRequestsRoutePage() {
  return (
    <Suspense fallback={<RequestsRouteFallback />}>
      <AdminServiceRequestsListPage />
    </Suspense>
  );
}
