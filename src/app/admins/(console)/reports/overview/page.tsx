import { Suspense } from "react";

import { AdminReportsOverviewPage } from "@/components/admin-panel/reports/admin-reports-overview-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminReportsOverviewPage />
    </Suspense>
  );
}
