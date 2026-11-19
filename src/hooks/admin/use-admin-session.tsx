"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  fetchAdminMe,
  logoutAdminSession,
  logoutAllAdminSessions,
  type AdminMe,
} from "@/lib/api/admin-auth";
import { ADMIN_SESSION_EXPIRED_EVENT } from "@/lib/api/admin-client";
import { isApiClientError } from "@/lib/api/envelope";

interface AdminSessionContextValue {
  admin: AdminMe | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setAdmin: (admin: AdminMe | null) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(
  null,
);

function redirectToLogin(router: ReturnType<typeof useRouter>) {
  const next =
    typeof window === "undefined"
      ? "/admins"
      : `${window.location.pathname}${window.location.search}`;
  router.replace(
    next.startsWith("/admins/login")
      ? "/admins/login"
      : `/admins/login?next=${encodeURIComponent(next)}`,
  );
}

export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchAdminMe()
      .then((me) => {
        if (!cancelled) {
          setAdmin(me);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setAdmin(null);

        if (
          isApiClientError(cause) &&
          (cause.status === 401 ||
            cause.status === 403 ||
            cause.code === "AUTH_REQUIRED" ||
            cause.code === "INVALID_SESSION" ||
            cause.code === "CSRF_INVALID")
        ) {
          setError(null);
          redirectToLogin(router);
          return;
        }

        // Any failed session probe for console routes → login, not a stuck blank page.
        setError(null);
        redirectToLogin(router);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Any admin API call that reports a dead session (idle timeout, absolute
  // expiry, revoked from another device) lands here exactly once.
  const expiredHandledRef = useRef(false);
  useEffect(() => {
    function onSessionExpired() {
      if (expiredHandledRef.current) return;
      expiredHandledRef.current = true;
      setAdmin(null);
      toast.error("نشست شما منقضی شد. لطفاً دوباره وارد شوید.");
      redirectToLogin(router);
    }

    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => {
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [router]);

  useEffect(() => {
    if (admin) expiredHandledRef.current = false;
  }, [admin]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const me = await fetchAdminMe();
      setAdmin(me);
    } catch (cause) {
      setAdmin(null);

      if (
        isApiClientError(cause) &&
        (cause.status === 401 ||
          cause.code === "AUTH_REQUIRED" ||
          cause.code === "INVALID_SESSION")
      ) {
        setError(null);
        redirectToLogin(router);
        return;
      }

      setError(
        isApiClientError(cause)
          ? cause.message
          : "بارگذاری نشست مدیر ناموفق بود.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await logoutAdminSession();
    } finally {
      setAdmin(null);
      router.replace("/admins/login");
    }
  }, [router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllAdminSessions();
    } finally {
      setAdmin(null);
      router.replace("/admins/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      admin,
      error,
      loading,
      logout,
      logoutAll,
      refresh,
      setAdmin,
    }),
    [admin, error, loading, logout, logoutAll, refresh],
  );

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession باید داخل AdminSessionProvider استفاده شود.");
  }
  return context;
}
