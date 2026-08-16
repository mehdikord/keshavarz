"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  AdminPageHeader,
  AdminSectionCard,
  AdminStatusBadge,
} from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminSession } from "@/hooks/admin/use-admin-session";
import { patchAdminMe, type AdminMe } from "@/lib/api/admin-auth";
import { isApiClientError } from "@/lib/api/envelope";

function AdminMeForm({
  admin,
  onUpdated,
}: {
  admin: AdminMe;
  onUpdated: (admin: AdminMe) => void;
}) {
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email ?? "");
  const [saving, setSaving] = useState(false);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await patchAdminMe({
        name: name.trim(),
        email: email.trim() ? email.trim() : null,
      });
      onUpdated(updated);
      toast.success("پروفایل به‌روزرسانی شد");
    } catch (cause) {
      toast.error(
        isApiClientError(cause) ? cause.message : "ذخیره پروفایل ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <AdminPageHeader
        title="پروفایل مدیر"
        description="اطلاعات حساب جاری و مجوزهای مؤثر."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <AdminSectionCard>
          <form className="space-y-4" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="admin-name">نام</Label>
              <Input
                id="admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-lg"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">ایمیل</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label>موبایل</Label>
              <Input value={admin.phone} disabled className="rounded-lg" dir="ltr" />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </form>
        </AdminSectionCard>

        <div className="space-y-4">
          <AdminSectionCard>
            <p className="text-sm text-muted-foreground">وضعیت دسترسی</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {admin.isSuperAdmin ? (
                <AdminStatusBadge status="approved" label="Super Admin" />
              ) : (
                <AdminStatusBadge status="active" label="مدیر عادی" />
              )}
            </div>
            <p className="mt-3 font-mono text-xs text-muted-foreground" dir="ltr">
              {admin.adminId}
            </p>
          </AdminSectionCard>

          <AdminSectionCard>
            <p className="mb-3 text-sm font-medium">مجوزهای مؤثر</p>
            {admin.isSuperAdmin ? (
              <p className="text-sm text-muted-foreground">
                Super Admin می‌تواند تمام مجوزها را دور بزند (مگر deny صریح).
              </p>
            ) : null}
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {admin.permissions.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  مجوزی تخصیص نشده است.
                </li>
              ) : (
                admin.permissions.map((permission) => (
                  <li
                    key={permission}
                    className="rounded-md bg-muted/50 px-2 py-1 font-mono text-xs"
                    dir="ltr"
                  >
                    {permission}
                  </li>
                ))
              )}
            </ul>
          </AdminSectionCard>
        </div>
      </div>
    </div>
  );
}

export default function AdminMePage() {
  const { admin, setAdmin } = useAdminSession();

  if (!admin) return null;

  return (
    <AdminMeForm
      key={admin.adminId}
      admin={admin}
      onUpdated={setAdmin}
    />
  );
}
