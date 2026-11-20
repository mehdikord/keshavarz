"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { errorMessage, fieldErrors } from "@/lib/admin/api";
import { toast } from "@/lib/toast";

/**
 * Runs an admin mutation: pending state, field errors, a toast with the
 * outcome, then a server refresh so every panel shows the new state.
 */
export function useAdminAction() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    setRunning(true);
    setErrors({});
    setError(null);
    try {
      await action();
      toast.success(success);
      startTransition(() => router.refresh());
      return true;
    } catch (caught) {
      const fields = fieldErrors(caught);
      setErrors(fields);
      const message = errorMessage(caught);
      setError(message);
      if (Object.keys(fields).length === 0) toast.error(message);
      return false;
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setErrors({});
    setError(null);
  }

  return { error, errors, pending: running || refreshing, reset, run };
}
