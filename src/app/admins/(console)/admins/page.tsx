import { Suspense } from "react";

import { AdminAdminsListPage } from "@/components/admin-panel/rbac/admin-admins-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminAdminsRoutePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AdminAdminsListPage />
    </Suspense>
  );
}
