"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { adminApi } from "@/lib/admin/api";

export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    setPending(true);
    try {
      await adminApi.post("/auth/logout");
    } catch {
      // The session may already be gone; the login page is still the right place.
    }
    router.replace("/admins/login");
    router.refresh();
  }
  return { pending, signOut };
}
