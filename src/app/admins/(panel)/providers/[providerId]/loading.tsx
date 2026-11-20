import { Skeleton } from "@/components/admin/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="در حال بارگذاری خدمات‌دهنده" className="grid gap-5">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-[220px] w-full rounded-2xl" />
      <Skeleton className="h-10 w-[30rem] max-w-full" />
      <Skeleton className="h-[360px] w-full rounded-2xl" />
    </div>
  );
}
