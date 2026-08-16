import { Skeleton } from "@/components/ui/skeleton";

export default function AdminsLoading() {
  return (
    <div className="flex min-h-dvh bg-[var(--admin-canvas)]">
      <div className="hidden w-[var(--admin-sidebar-width)] shrink-0 bg-[var(--admin-sidebar)] lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[var(--admin-topbar-height)] items-center border-b border-[var(--admin-border)] bg-[var(--admin-topbar)] px-6">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-10 w-full max-w-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
