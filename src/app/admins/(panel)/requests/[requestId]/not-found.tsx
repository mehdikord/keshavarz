import { SearchX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/admin/ui/button";
import { EmptyState, Panel } from "@/components/admin/ui/panel";

export default function RequestNotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-lg">
      <EmptyState
        action={
          <Link className={buttonVariants({ variant: "outline" })} href="/admins/requests">
            بازگشت به درخواست‌ها
          </Link>
        }
        description="شناسه درخواست اشتباه است یا چنین درخواستی وجود ندارد."
        icon={<SearchX />}
        title="درخواست پیدا نشد"
      />
    </Panel>
  );
}
