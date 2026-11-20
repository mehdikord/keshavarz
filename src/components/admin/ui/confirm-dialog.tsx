"use client";

import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";

export function ConfirmDialog({
  children,
  confirm,
  description,
  disabled,
  onConfirm,
  onOpenChange,
  open,
  pending,
  title,
  tone = "danger",
}: {
  children?: React.ReactNode;
  confirm: string;
  description: string;
  disabled?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  title: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent description={description} size="sm" title={title}>
        {children ? <DialogBody>{children}</DialogBody> : null}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            انصراف
          </Button>
          <Button disabled={disabled} loading={pending} onClick={onConfirm} variant={tone === "danger" ? "danger" : "primary"}>
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
