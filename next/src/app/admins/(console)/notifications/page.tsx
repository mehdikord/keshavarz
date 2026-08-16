import { Suspense } from "react";

import { AdminNotificationsPage } from "@/components/admin-panel/notifications/admin-notifications-page";
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
      <AdminNotificationsPage />
    </Suspense>
  );
}
