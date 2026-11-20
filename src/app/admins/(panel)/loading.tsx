import { Skeleton } from "@/components/admin/ui/skeleton";

export default function AdminPanelLoading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری" className="grid gap-5">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}
