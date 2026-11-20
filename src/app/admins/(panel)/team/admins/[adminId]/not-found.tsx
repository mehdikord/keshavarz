import Link from "next/link";
import { UserX } from "lucide-react";

import { buttonVariants } from "@/components/admin/ui/button";
import { EmptyState, Panel } from "@/components/admin/ui/panel";

export default function AdminNotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg">
      <EmptyState
        action={
          <Link className={buttonVariants({ variant: "outline" })} href="/admins/team/admins">
            بازگشت به فهرست مدیران
          </Link>
        }
        description="شناسه نادرست است یا این حساب حذف شده است."
        icon={<UserX />}
        title="مدیر پیدا نشد"
      />
    </Panel>
  );
}
