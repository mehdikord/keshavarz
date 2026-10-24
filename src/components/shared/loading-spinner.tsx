"use client";

import { motion } from "framer-motion";

import { SproutMark } from "@/components/shared/sprout-mark";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  fullPage?: boolean;
}

/** In-app loader: a small sprout growing inside an orbiting ring. */
export function LoadingSpinner({
  label = "در حال بارگذاری...",
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullPage && "min-h-[50dvh]",
        className,
      )}
    >
      <span className="relative flex size-16 items-center justify-center">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-primary/10 border-t-primary/70"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/[0.07]">
          <SproutMark
            intro={false}
            className="size-10"
            stemColor="#2d6a4f"
            leafColor="#40916c"
            leafAltColor="#74c69d"
            soilColor="rgba(45,106,79,0.15)"
          />
        </span>
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}
