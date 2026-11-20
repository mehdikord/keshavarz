import { Skeleton } from "@/components/admin/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری درخواست‌ها" className="grid gap-4">
      <div className="mb-2 grid gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-9 w-[36rem] max-w-full" />
      <Skeleton className="h-[480px] w-full rounded-2xl" />
    </div>
  );
}
