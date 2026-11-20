import { Skeleton } from "@/components/admin/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری درخواست" className="grid gap-5">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
