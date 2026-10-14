import { Suspense } from "react";

import { AdminSubscriptionPlansPage } from "@/components/admin-panel/subscriptions/admin-subscription-plans-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminSubscriptionPlansRoutePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminSubscriptionPlansPage />
    </Suspense>
  );
}
