import { Skeleton } from "@/components/admin/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری گزارش" className="grid gap-5">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-[30rem] max-w-full" />
      </div>
      <Skeleton className="h-9 w-[34rem] max-w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-[230px] w-full rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
    </div>
  );
}
