"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppMenuStore } from "@/stores/app-menu-store";

interface AppMenuTriggerProps {
  className?: string;
  variant?: "ghost" | "outline" | "secondary";
}

export function AppMenuTrigger({
  className,
  variant = "ghost",
}: AppMenuTriggerProps) {
  const open = useAppMenuStore((state) => state.open);

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      className={cn("rounded-xl", className)}
      onClick={open}
      aria-label="باز کردن منو"
    >
      <Menu className="size-5" strokeWidth={1.75} />
    </Button>
  );
}
