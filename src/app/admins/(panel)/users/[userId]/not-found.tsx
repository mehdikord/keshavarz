import Link from "next/link";
import { UserRoundSearch } from "lucide-react";

import { buttonVariants } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";

export default function AdminUserNotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg px-8 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <UserRoundSearch className="size-6" />
      </div>
      <h1 className="text-lg font-extrabold">این کاربر پیدا نشد</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
        ممکن است نشانی اشتباه باشد. کاربر را از فهرست کاربران جستجو کنید.
      </p>
      <Link className={buttonVariants({ className: "mt-6", variant: "outline" })} href="/admins/users">
        رفتن به فهرست کاربران
      </Link>
    </Panel>
  );
}
