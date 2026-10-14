import { Suspense } from "react";

import { AdminUsersListPage } from "@/components/admin-panel/users/admin-users-list-page";
import { Skeleton } from "@/components/ui/skeleton";

function UsersRouteFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminUsersRoutePage() {
  return (
    <Suspense fallback={<UsersRouteFallback />}>
      <AdminUsersListPage />
    </Suspense>
  );
}
