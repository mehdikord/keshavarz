"use client";

import { Play, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { adminApi, errorMessage } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { toast } from "@/lib/toast";

interface RunResult {
  jobs: Record<string, { durationMs: number; error?: string; ok: boolean; reason?: string; skipped?: boolean }>;
}

export function RefreshStatusButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button loading={pending} onClick={() => startTransition(() => router.refresh())} variant="outline">
      {pending ? null : <RefreshCw />}
      بررسی دوباره
    </Button>
  );
}

/** Runs a background job now; `job="all"` runs every registered job in turn. */
export function RunJobButton({ job, label }: { job: string; label?: string }) {
  const canManage = useCan(ADMIN_PERMISSIONS.settingsManage);
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [refreshing, startTransition] = useTransition();
  if (!canManage) return null;

  async function run() {
    setRunning(true);
    try {
      const result = await adminApi.post<RunResult>("/settings/jobs/run", { job });
      const entries = Object.values(result.jobs);
      const failed = entries.filter((entry) => !entry.ok);
      const skipped = entries.filter((entry) => entry.skipped);
      if (failed.length > 0) toast.error(`اجرا با خطا تمام شد: ${failed[0]?.error ?? "خطای ناشناخته"}`);
      else if (skipped.length === entries.length) toast.info("این کار هم‌اکنون در حال اجرا توسط پروسه دیگری است.");
      else toast.success(job === "all" ? "همه کارها اجرا شدند." : "کار با موفقیت اجرا شد.");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button
      aria-label={label ? `اجرای ${label}` : "اجرای همه کارها"}
      loading={running || refreshing}
      onClick={() => void run()}
      size={job === "all" ? "md" : "sm"}
      variant={job === "all" ? "primary" : "outline"}
    >
      {running || refreshing ? null : <Play />}
      {job === "all" ? "اجرای همه" : "اجرا"}
    </Button>
  );
}
