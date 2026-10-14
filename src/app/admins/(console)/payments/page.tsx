import { Suspense } from "react";

import { AdminPaymentsListPage } from "@/components/admin-panel/payments/admin-payments-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminPaymentsRoutePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminPaymentsListPage />
    </Suspense>
  );
}
