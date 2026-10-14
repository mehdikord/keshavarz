import { Suspense } from "react";

import { AdminServicesPage } from "@/components/admin-panel/catalog/admin-services-page";
import { Skeleton } from "@/components/ui/skeleton";

function CatalogRouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminServicesRoutePage() {
  return (
    <Suspense fallback={<CatalogRouteFallback />}>
      <AdminServicesPage />
    </Suspense>
  );
}
