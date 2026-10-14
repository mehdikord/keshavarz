"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import { Button } from "@/components/ui/button";

interface AdminForbiddenProps {
  title?: string;
  description?: string;
}

export function AdminForbidden({
  title = "دسترسی مجاز نیست",
  description = "برای مشاهده این بخش مجوز لازم را ندارید. در صورت نیاز با مدیر ارشد هماهنگ کنید.",
}: AdminForbiddenProps) {
  return (
    <AdminSectionCard className="mx-auto max-w-lg text-center">
      <div className="flex flex-col items-center gap-3 py-4">
        <ShieldAlert className="size-10 text-destructive" />
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admins">بازگشت به داشبورد</Link>
        </Button>
      </div>
    </AdminSectionCard>
  );
}
