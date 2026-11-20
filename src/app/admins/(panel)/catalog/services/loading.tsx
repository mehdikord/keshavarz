import { Skeleton } from "@/components/admin/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری" className="grid gap-4">
      <div className="mb-2 grid gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-[440px] w-full rounded-2xl" />
    </div>
  );
}
