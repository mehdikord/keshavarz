import { Suspense } from "react";

import { AdminProvidersListPage } from "@/components/admin-panel/providers/admin-providers-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function ProvidersRouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminProvidersRoutePage() {
  return (
    <Suspense fallback={<ProvidersRouteFallback />}>
      <AdminProvidersListPage />
    </Suspense>
  );
}
