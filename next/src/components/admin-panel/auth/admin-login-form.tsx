"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as z from "zod";

import { AdminSectionCard } from "@/components/admin-panel/shell/admin-section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAdminMe, loginAdmin } from "@/lib/api/admin-auth";
import { isApiClientError } from "@/lib/api/envelope";

const LoginFormSchema = z.object({
  phone: z.string().trim().min(10, "شماره موبایل معتبر نیست."),
  password: z.string().min(1, "رمز عبور الزامی است."),
});

interface AdminLoginFormProps {
  nextPath?: string;
}

export function AdminLoginForm({ nextPath = "/admins" }: AdminLoginFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const safeNext = useMemo(() => {
    if (!nextPath.startsWith("/admins")) return "/admins";
    if (nextPath.startsWith("/admins/login")) return "/admins";
    return nextPath;
  }, [nextPath]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    const parsed = LoginFormSchema.safeParse({ phone, password });
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await loginAdmin(parsed.data);
      await fetchAdminMe();
      toast.success("ورود موفق بود");
      router.replace(safeNext);
      router.refresh();
    } catch (cause) {
      const message = isApiClientError(cause)
        ? cause.message
        : "ورود ناموفق بود. دوباره تلاش کنید.";
      toast.error(message);
      if (isApiClientError(cause) && cause.fields) {
        const nextErrors: Record<string, string> = {};
        for (const [key, values] of Object.entries(cause.fields)) {
          if (values[0]) nextErrors[key] = values[0];
        }
        setFieldErrors(nextErrors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminSectionCard>
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="admin-phone">موبایل</Label>
          <Input
            id="admin-phone"
            name="phone"
            inputMode="numeric"
            autoComplete="username"
            placeholder="09xxxxxxxxx"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-lg"
            disabled={submitting}
          />
          {fieldErrors.phone ? (
            <p className="text-xs text-destructive">{fieldErrors.phone}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-password">رمز عبور</Label>
          <Input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg"
            disabled={submitting}
          />
          {fieldErrors.password ? (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "در حال ورود..." : "ورود"}
        </Button>
      </form>
    </AdminSectionCard>
  );
}
