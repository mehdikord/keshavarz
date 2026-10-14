import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/types";

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  pending_provider: {
    label: "در انتظار تأیید",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  in_progress: {
    label: "در حال انجام",
    className: "border-sky-200 bg-sky-50 text-sky-800",
  },
  completed: {
    label: "پایان‌یافته",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  cancelled: {
    label: "لغوشده",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
