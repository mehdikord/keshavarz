"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/stores/auth-store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <LoadingSpinner fullPage label="در حال بررسی دسترسی..." />;
  }

  return children;
}
