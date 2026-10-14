import { Suspense } from "react";

import { AdminProviderSubscriptionsPage } from "@/components/admin-panel/subscriptions/admin-provider-subscriptions-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminProviderSubscriptionsRoutePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminProviderSubscriptionsPage />
    </Suspense>
  );
}
