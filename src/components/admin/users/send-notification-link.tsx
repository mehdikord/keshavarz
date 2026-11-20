"use client";

import { Send } from "lucide-react";
import Link from "next/link";

import { useCan } from "@/components/admin/shell/admin-context";
import { buttonVariants } from "@/components/admin/ui/button";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

/** Opens the notification composer with this user already picked as the recipient. */
export function SendNotificationLink({ userId }: { userId: string }) {
  const canSend = useCan(ADMIN_PERMISSIONS.notificationsSend);
  if (!canSend) return null;
  return (
    <Link className={buttonVariants({ variant: "outline" })} href={`/admins/notifications/new?user=${userId}`}>
      <Send />
      ارسال اعلان
    </Link>
  );
}
