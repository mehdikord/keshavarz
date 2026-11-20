import Link from "next/link";
import { Tractor } from "lucide-react";

import { buttonVariants } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";

export default function ProviderNotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg px-8 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Tractor className="size-6" />
      </div>
      <h1 className="text-lg font-extrabold">خدمات‌دهنده پیدا نشد</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
        ممکن است این کاربر پروفایل خدمات‌دهندگی نداشته باشد یا پیوند اشتباه باشد.
      </p>
      <Link className={buttonVariants({ className: "mt-6", variant: "outline" })} href="/admins/providers">
        بازگشت به فهرست خدمات‌دهندگان
      </Link>
    </Panel>
  );
}
