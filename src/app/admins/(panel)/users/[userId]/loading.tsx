import { Skeleton } from "@/components/admin/ui/skeleton";

export default function AdminUserLoading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری پرونده کاربر" className="grid gap-5">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
