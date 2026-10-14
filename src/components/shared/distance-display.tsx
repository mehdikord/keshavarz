import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/format";

interface DistanceDisplayProps {
  km: number;
  className?: string;
  showIcon?: boolean;
}

export function DistanceDisplay({
  km,
  className,
  showIcon = true,
}: DistanceDisplayProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm text-muted-foreground",
        className,
      )}
    >
      {showIcon ? <MapPin className="size-3.5 text-primary" /> : null}
      {formatDistance(km)}
    </span>
  );
}
