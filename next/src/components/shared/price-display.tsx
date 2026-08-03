import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils/format";

interface PriceDisplayProps {
  amount: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({
  amount,
  className,
  size = "md",
}: PriceDisplayProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base font-semibold",
    lg: "text-xl font-bold",
  }[size];

  return (
    <span className={cn("text-primary tabular-nums", sizeClass, className)}>
      {formatPrice(amount)}
    </span>
  );
}
