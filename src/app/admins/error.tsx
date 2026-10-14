"use client";

import { useEffect } from "react";

export default function AdminsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--admin-canvas)] px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-6 text-center shadow-sm">
        <h2 className="text-lg font-bold text-foreground">خطای پنل مدیریت</h2>
        <p className="text-sm text-muted-foreground">
          مشکلی در بارگذاری این بخش رخ داد. می‌توانید دوباره تلاش کنید.
        </p>
        {error.digest ? (
          <p className="font-mono text-xs text-muted-foreground">
            digest: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
