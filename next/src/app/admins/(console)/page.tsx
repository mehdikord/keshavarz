import { Suspense } from "react";

import { AdminDashboardPage } from "@/components/admin-panel/dashboard/admin-dashboard-page";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardRouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardRoutePage() {
  return (
    <Suspense fallback={<DashboardRouteFallback />}>
      <AdminDashboardPage />
    </Suspense>
  );
}
