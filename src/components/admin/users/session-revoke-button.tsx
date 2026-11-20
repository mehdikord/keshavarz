"use client";

import { LogOut } from "lucide-react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export function SessionRevokeButton({ sessionId, userId }: { sessionId: string | null; userId: string }) {
  const canRevoke = useCan(ADMIN_PERMISSIONS.usersChangeStatus);
  const action = useAdminAction();
  if (!canRevoke || !sessionId) return null;
  return (
    <Button
      loading={action.pending}
      onClick={() =>
        action.run(() => adminApi.post(`/users/${userId}/sessions/revoke`, { sessionId }), "نشست بسته شد.")
      }
      size="sm"
      variant="danger-soft"
    >
      <LogOut />
      خروج
    </Button>
  );
}
