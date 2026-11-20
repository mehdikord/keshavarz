"use client";

import { cn } from "@/lib/utils";

export function Switch({
  checked,
  className,
  disabled,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className,
      )}
      disabled={disabled}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-[right] duration-150 ease-out motion-reduce:transition-none",
          checked ? "right-[calc(100%-1.3rem)]" : "right-0.5",
        )}
      />
    </button>
  );
}
