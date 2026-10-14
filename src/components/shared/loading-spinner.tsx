import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  label = "در حال بارگذاری...",
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullPage && "min-h-[50dvh]",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" strokeWidth={1.75} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
