import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/admin/ui/button";
import { Panel } from "@/components/admin/ui/panel";

export function AdminForbidden({ section }: { section: string }) {
  return (
    <Panel className="mx-auto mt-10 max-w-lg px-8 py-12 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-warn-soft text-warn">
        <ShieldAlert className="size-6" />
      </div>
      <h1 className="text-lg font-extrabold">به {section} دسترسی ندارید</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-6 text-muted-foreground">
        اگر برای کارتان به این بخش نیاز دارید، از مدیر ارشد بخواهید دسترسی لازم را به نقش شما اضافه کند.
      </p>
      <Link className={buttonVariants({ className: "mt-6", variant: "outline" })} href="/admins">
        بازگشت به داشبورد
      </Link>
    </Panel>
  );
}
