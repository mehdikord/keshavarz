"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Search, Tractor } from "lucide-react";
import { useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const currentDisplayName = displayName || user.displayName;

  const handleSave = () => {
    const value = currentDisplayName.trim();

    if (value.length < 2) {
      setError("نام نمایشی باید حداقل ۲ کاراکتر باشد");
      return;
    }

    if (!user || value === user.displayName) {
      return;
    }

    updateDisplayName(value);
    setError(null);
    toast.success("پروفایل به‌روزرسانی شد");
  };

  const handleLogout = () => {
    logout();
    toast.info("خروج از حساب");
    router.replace("/auth");
  };

  return (
    <PageContainer>
      <PageHeader
        title="پروفایل"
        description="مدیریت حساب کاربری شما"
        backHref="/"
      />

      <Card className="card-elevated mb-4 border-border/80">
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.displayName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user.displayName}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {user.phone}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">نام نمایشی</Label>
            <Input
              id="displayName"
              key={user.displayName}
              defaultValue={user.displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (error) setError(null);
              }}
              className="h-11 rounded-xl"
              placeholder="نام شما در اپلیکیشن"
            />
            {error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : null}
          </div>

          <Button
            type="button"
            className="h-11 w-full rounded-xl"
            onClick={handleSave}
          >
            ذخیره تغییرات
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <p className="px-1 text-xs font-semibold text-muted-foreground">
          میانبر پنل‌ها
        </p>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full justify-start rounded-xl border-primary/20"
        >
          <Link href="/providers/home">
            <Tractor className="size-4 text-primary" />
            پنل خدمات‌دهنده
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full justify-start rounded-xl border-accent/30"
        >
          <Link href="/users/home">
            <Search className="size-4 text-accent" />
            پنل خدمات‌گیرنده
          </Link>
        </Button>
      </div>

      <Button
        variant="destructive"
        className="mt-6 h-11 w-full rounded-xl"
        onClick={handleLogout}
      >
        <LogOut className="size-4" />
        خروج از حساب
      </Button>
    </PageContainer>
  );
}
