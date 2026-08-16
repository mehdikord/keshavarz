"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AdminFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onApply: () => void;
  onReset: () => void;
  applyLabel?: string;
  resetLabel?: string;
}

export function AdminFilterDrawer({
  open,
  onOpenChange,
  title = "فیلتر پیشرفته",
  description = "فیلترها پس از اعمال روی URL همگام می‌شوند.",
  children,
  onApply,
  onReset,
  applyLabel = "اعمال فیلتر",
  resetLabel = "بازنشانی",
}: AdminFilterDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">{children}</div>

        <SheetFooter className="gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply();
              onOpenChange(false);
            }}
          >
            {applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
