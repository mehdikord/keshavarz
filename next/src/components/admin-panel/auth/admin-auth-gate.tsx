"use client";

import { useAdminSession } from "@/hooks/admin/use-admin-session";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { admin, error, loading, refresh } = useAdminSession();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
        <p className="font-medium text-foreground">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        در حال انتقال به ورود...
      </div>
    );
  }

  return children;
}
