"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/stores/auth-store";

interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return <LoadingSpinner fullPage label="در حال انتقال..." />;
  }

  return children;
}
