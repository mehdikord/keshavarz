"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  destructive = false,
  requireReason = false,
  reasonLabel = "دلیل",
  reasonPlaceholder = "دلیل این اقدام را بنویسید...",
  loading = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [reason, setReason] = useState("");
  // Guards against double-submit even when the caller doesn't pass `loading`.
  const [pending, setPending] = useState(false);
  const busy = loading || pending;

  // Reset the reason whenever the dialog closes (also when closed by the
  // caller after success), so it never carries over to the next item.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setReason("");
  }

  const canConfirm = !requireReason || reason.trim().length >= 3;

  function requestClose() {
    if (busy) return;
    onOpenChange(false);
  }

  async function confirm() {
    if (busy || !canConfirm) return;
    setPending(true);
    try {
      // Keep the reason on failure so the admin doesn't have to retype it.
      await onConfirm(requireReason ? reason.trim() : undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {requireReason ? (
          <div className="space-y-2">
            <Label htmlFor="admin-confirm-reason">{reasonLabel}</Label>
            <Textarea
              id="admin-confirm-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              disabled={busy}
            />
            {reason.length > 0 && reason.trim().length < 3 ? (
              <p className="text-xs text-muted-foreground">حداقل ۳ کاراکتر</p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={requestClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={!canConfirm || busy}
            onClick={() => void confirm()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
