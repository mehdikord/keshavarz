"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminPageHeader, AdminSectionCard } from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeAdminPassword } from "@/lib/api/admin-auth";
import { isApiClientError } from "@/lib/api/envelope";

export default function AdminChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("تکرار رمز جدید یکسان نیست.");
      return;
    }

    setSaving(true);
    try {
      await changeAdminPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("رمز عبور تغییر کرد");
    } catch (cause) {
      toast.error(
        isApiClientError(cause) ? cause.message : "تغییر رمز ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title="تغییر رمز عبور"
        description="رمز فعلی لازم است. پس از تغییر، سایر نشست‌ها باطل می‌شوند."
      />
      <AdminSectionCard className="max-w-lg">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="current-password">رمز فعلی</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="rounded-lg"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">رمز جدید</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="rounded-lg"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">حداقل ۱۲ کاراکتر</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تکرار رمز جدید</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="rounded-lg"
              disabled={saving}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "در حال تغییر..." : "تغییر رمز"}
          </Button>
        </form>
      </AdminSectionCard>
    </div>
  );
}
