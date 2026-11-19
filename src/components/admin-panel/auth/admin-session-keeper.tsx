"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TimerReset } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminSession } from "@/hooks/admin/use-admin-session";
import {
  fetchAdminSessionInfo,
  refreshAdminSession,
  type AdminSessionInfo,
} from "@/lib/api/admin-auth";
import {
  ADMIN_SESSION_EXPIRED_EVENT,
  getLastAdminActivityAt,
} from "@/lib/api/admin-client";

/** Show the inactivity warning this long before the server idle timeout. */
const IDLE_WARNING_MS = 2 * 60 * 1000;
/** Probe slightly after the deadline so the server has really expired it. */
const IDLE_GRACE_MS = 5 * 1000;
/** Refresh this long after entering the server's refresh window. */
const REFRESH_MARGIN_MS = 60 * 1000;
const TICK_MS = 5 * 1000;

interface SessionTiming {
  /** Local epoch ms of the absolute expiry (server clock skew removed). */
  expiresAt: number;
  idleTimeoutMs: number;
  refreshWindowMs: number;
  /** Local epoch ms when the timing was read (counts as activity). */
  readAt: number;
}

function toTiming(info: AdminSessionInfo): SessionTiming {
  const now = Date.now();
  const skew = Date.parse(info.serverTime) - now;
  return {
    expiresAt: Date.parse(info.expiresAt) - skew,
    idleTimeoutMs: info.idleTimeoutSeconds * 1000,
    refreshWindowMs: info.refreshWindowSeconds * 1000,
    readAt: now,
  };
}

const faDigits = new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 });

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${faDigits.format(minutes)}:${faDigits.format(seconds)}`;
}

/**
 * Keeps the admin session alive while the operator works: rotates it inside
 * the server's refresh window before the absolute expiry, and warns before the
 * idle timeout signs the operator out.
 */
export function AdminSessionKeeper() {
  const { admin, logout } = useAdminSession();
  const [timing, setTiming] = useState<SessionTiming | null>(null);
  const [idleRemainingMs, setIdleRemainingMs] = useState<number | null>(null);
  const [extending, setExtending] = useState(false);
  const probingRef = useRef(false);

  const loadTiming = useCallback(async () => {
    const info = await fetchAdminSessionInfo();
    const next = toTiming(info);
    setTiming(next);
    return next;
  }, []);

  const adminId = admin?.adminId;
  useEffect(() => {
    if (!adminId) return;
    let cancelled = false;
    void fetchAdminSessionInfo()
      .then((info) => {
        if (!cancelled) setTiming(toTiming(info));
      })
      .catch(() => {
        // A dead session is handled globally; anything else just disables
        // the keeper until the console remounts.
      });
    return () => {
      cancelled = true;
    };
  }, [adminId]);

  // Absolute expiry: rotate the session once it enters the refresh window.
  useEffect(() => {
    if (!timing) return;

    const refreshAt = timing.expiresAt - timing.refreshWindowMs + REFRESH_MARGIN_MS;
    const delay = Math.max(0, refreshAt - Date.now());
    let attempts = 0;
    let timer: number | undefined;

    const attempt = () => {
      attempts += 1;
      void refreshAdminSession()
        .then(() => loadTiming())
        .catch(() => {
          if (attempts >= 3 || Date.now() >= timing.expiresAt) {
            // Let the probe decide: a dead session fires the global event.
            void loadTiming().catch(() => undefined);
            return;
          }
          timer = window.setTimeout(attempt, 60 * 1000);
        });
    };

    // setTimeout overflows above ~24.8 days; sessions are far shorter.
    timer = window.setTimeout(attempt, delay);
    return () => window.clearTimeout(timer);
  }, [loadTiming, timing]);

  const warningOpen = idleRemainingMs !== null;

  // Idle timeout: warn ahead of it, then confirm with the server once passed.
  // Ticks every second while the countdown is visible.
  useEffect(() => {
    if (!timing) return;

    const tick = () => {
      const lastActivity = Math.max(getLastAdminActivityAt(), timing.readAt);
      const remaining = lastActivity + timing.idleTimeoutMs - Date.now();

      if (remaining > IDLE_WARNING_MS) {
        setIdleRemainingMs(null);
        return;
      }

      setIdleRemainingMs(Math.max(0, remaining));

      if (remaining <= -IDLE_GRACE_MS && !probingRef.current) {
        probingRef.current = true;
        // If another tab kept the session alive this succeeds; otherwise the
        // 401 triggers the global sign-out.
        void loadTiming()
          .catch(() => {
            window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT));
          })
          .finally(() => {
            probingRef.current = false;
          });
      }
    };

    tick();
    const interval = window.setInterval(tick, warningOpen ? 1000 : TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadTiming, timing, warningOpen]);

  async function staySignedIn() {
    setExtending(true);
    try {
      await loadTiming();
      setIdleRemainingMs(null);
    } catch {
      // Global handler signs out if the session is already gone.
    } finally {
      setExtending(false);
    }
  }

  return (
    <Dialog open={warningOpen} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <TimerReset className="size-5" />
          </div>
          <DialogTitle>نشست شما در حال پایان است</DialogTitle>
          <DialogDescription>
            به دلیل عدم فعالیت، تا{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCountdown(idleRemainingMs ?? 0)}
            </span>{" "}
            دیگر از پنل خارج می‌شوید. برای ادامه کار، نشست را تمدید کنید.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => void staySignedIn()} disabled={extending}>
            {extending ? "در حال تمدید..." : "ادامه کار"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            خروج
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
