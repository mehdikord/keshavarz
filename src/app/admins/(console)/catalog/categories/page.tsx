import { Suspense } from "react";

import { AdminCategoriesPage } from "@/components/admin-panel/catalog/admin-categories-page";
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

export default function AdminCategoriesRoutePage() {
  return (
    <Suspense fallback={<CatalogRouteFallback />}>
      <AdminCategoriesPage />
    </Suspense>
  );
}
