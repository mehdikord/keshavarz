"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";

export default function AdminPanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Panel className="mx-auto mt-10 max-w-lg px-8 py-12 text-center" role="alert">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-6" />
      </div>
      <h1 className="text-lg font-extrabold">بارگذاری این صفحه ممکن نشد</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
        اتصال به سرور یا پایگاه داده با خطا روبه‌رو شد. دوباره تلاش کنید؛ اگر مشکل ادامه داشت، کد پیگیری را به تیم فنی بدهید.
      </p>
      {error.digest ? (
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          کد پیگیری: <bdi dir="ltr">{error.digest}</bdi>
        </p>
      ) : null}
      <Button className="mt-6" onClick={reset} variant="outline">
        <RotateCcw />
        تلاش دوباره
      </Button>
    </Panel>
  );
}
