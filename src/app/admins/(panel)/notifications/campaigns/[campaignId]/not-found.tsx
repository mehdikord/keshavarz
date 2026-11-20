import Link from "next/link";

import { buttonVariants } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";

export default function CampaignNotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg px-8 py-12 text-center">
      <h1 className="text-lg font-extrabold">این ارسال پیدا نشد</h1>
      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">ممکن است پیوند اشتباه باشد. فهرست ارسال‌ها را ببینید.</p>
      <Link className={buttonVariants({ className: "mt-6", variant: "outline" })} href="/admins/notifications">
        بازگشت به اعلان‌ها
      </Link>
    </Panel>
  );
}
