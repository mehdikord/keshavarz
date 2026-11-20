import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    defaultVariants: { size: "md", variant: "primary" },
    variants: {
      size: {
        icon: "size-9",
        "icon-sm": "size-8 rounded-lg",
        lg: "h-11 px-5 text-sm",
        md: "h-9 px-3.5",
        sm: "h-8 rounded-lg px-2.5 text-xs",
      },
      variant: {
        danger: "bg-danger text-white hover:bg-danger/90",
        "danger-soft": "bg-danger-soft text-danger hover:bg-danger/15",
        ghost: "text-foreground/80 hover:bg-muted hover:text-foreground",
        outline: "border border-border bg-background text-foreground hover:border-input hover:bg-raised",
        primary: "bg-primary text-primary-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,0.18)] hover:bg-primary/90",
        soft: "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        wheat: "bg-wheat text-wheat-foreground hover:bg-wheat/90",
      },
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ asChild, children, className, disabled, loading, size, variant, ...props }: ButtonProps) {
  const Comp = asChild ? SlotPrimitive.Root : "button";
  return (
    <Comp
      className={cn(buttonVariants({ size, variant }), className)}
      data-loading={loading ? "" : undefined}
      disabled={asChild ? undefined : disabled || loading}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {children}
        </>
      )}
    </Comp>
  );
}
