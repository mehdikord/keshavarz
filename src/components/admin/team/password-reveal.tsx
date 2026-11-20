"use client";

import { KeyRound, TriangleAlert } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { CopyButton } from "@/components/admin/ui/copy-button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";

/** Shows a generated password exactly once; it is never stored in plain text. */
export function PasswordReveal({
  name,
  onClose,
  password,
}: {
  name: string;
  onClose: () => void;
  password: string | null;
}) {
  return (
    <Dialog onOpenChange={(open) => !open && onClose()} open={password !== null}>
      <DialogContent description={`رمز عبور ورود «${name}» به پنل`} size="sm" title="رمز عبور ساخته شد">
        <DialogBody>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised px-4 py-3">
            <KeyRound className="size-4 shrink-0 text-muted-foreground" />
            <code className="min-w-0 flex-1 truncate text-left font-mono text-[15px] font-bold tracking-wider" dir="ltr">
              {password}
            </code>
            {password ? <CopyButton label="کپی رمز عبور" value={password} /> : null}
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2.5 text-[12.5px] leading-6 text-warn">
            <TriangleAlert className="mt-1 size-4 shrink-0" />
            این رمز فقط همین یک بار نمایش داده می‌شود. آن را از راهی امن به مدیر بدهید و بخواهید پس از ورود از «حساب من» تغییرش دهد.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button onClick={onClose}>یادداشت کردم</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
