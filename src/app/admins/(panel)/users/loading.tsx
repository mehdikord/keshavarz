import { Skeleton } from "@/components/admin/ui/skeleton";

export default function AdminUsersLoading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری کاربران" className="grid gap-4">
      <div className="mb-2 grid gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-[28rem] max-w-full" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}
