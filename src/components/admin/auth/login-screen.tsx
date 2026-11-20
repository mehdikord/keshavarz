"use client";

import { Eye, EyeOff, LockKeyhole, Smartphone, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/admin/shell/brand-mark";
import { Button } from "@/components/admin/ui/button";
import { controlClass } from "@/components/admin/ui/input";
import { adminApi, errorMessage, fieldErrors } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

/** Rows of a ploughed field converging on the horizon, with a wheat sun. */
function FieldRows() {
  const rows = Array.from({ length: 17 }, (_, index) => index - 8);
  return (
    <svg aria-hidden className="absolute inset-x-0 bottom-0 h-[62%] w-full" preserveAspectRatio="none" viewBox="0 0 600 400">
      <defs>
        <linearGradient id="admin-login-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e7efe8" stopOpacity="0" />
          <stop offset="1" stopColor="#e7efe8" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      {rows.map((offset) => (
        <line
          key={offset}
          stroke="url(#admin-login-fade)"
          strokeWidth={offset === 0 ? 1.6 : 1}
          x1={300 + offset * 8}
          x2={300 + offset * 92}
          y1="0"
          y2="400"
        />
      ))}
      {[60, 130, 215, 310].map((y, index) => (
        <line key={y} stroke="#e7efe8" strokeOpacity={0.05 + index * 0.025} x1="0" x2="600" y1={y} y2={y} />
      ))}
    </svg>
  );
}

const PHONE_REQUIRED = "شماره موبایل را وارد کنید.";
const PASSWORD_REQUIRED = "رمز عبور را وارد کنید.";

export function AdminLoginScreen({ expired, next }: { expired: boolean; next: string }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const localErrors: Record<string, string> = {};
    if (!phone.trim()) localErrors.phone = PHONE_REQUIRED;
    if (!password) localErrors.password = PASSWORD_REQUIRED;
    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      return;
    }

    setPending(true);
    try {
      await adminApi.post("/auth/login", { password, phone });
      window.location.assign(next);
    } catch (caught) {
      setErrors(fieldErrors(caught));
      setError(errorMessage(caught, "ورود ممکن نشد. دوباره تلاش کنید."));
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <div className="leading-tight">
            <p className="text-base font-extrabold">کشاورز</p>
            <p className="text-xs text-muted-foreground">کنسول مدیریت</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">ورود به کنسول مدیریت</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            با شماره موبایل و رمز عبور حساب مدیریتی خود وارد شوید.
          </p>

          {expired && !error ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-info-soft px-3.5 py-3 text-[13px] leading-6 text-info" role="status">
              <LockKeyhole className="mt-1 size-4 shrink-0" />
              نشست شما به پایان رسید. برای ادامه دوباره وارد شوید.
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-[13px] leading-6 text-danger" role="alert">
              <TriangleAlert className="mt-1 size-4 shrink-0" />
              {error}
            </div>
          ) : null}

          <form className="mt-8 grid gap-5" noValidate onSubmit={onSubmit}>
            <div className="grid gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="admin-phone">
                شماره موبایل
              </label>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-describedby={errors.phone ? "admin-phone-error" : undefined}
                  aria-invalid={Boolean(errors.phone)}
                  autoComplete="username"
                  autoFocus
                  className={cn(controlClass, "h-11 pr-10 text-left text-[15px] tracking-wide")}
                  dir="ltr"
                  id="admin-phone"
                  inputMode="tel"
                  name="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09120000000"
                  value={phone}
                />
              </div>
              {errors.phone ? (
                <p className="text-xs text-danger" id="admin-phone-error">
                  {errors.phone}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <label className="text-[13px] font-semibold" htmlFor="admin-password">
                رمز عبور
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-describedby={errors.password ? "admin-password-error" : undefined}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  className={cn(controlClass, "h-11 pr-10 pl-11 text-left text-[15px]")}
                  dir="ltr"
                  id="admin-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 left-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-danger" id="admin-password-error">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <Button className="mt-2 w-full" loading={pending} size="lg" type="submit">
              ورود
            </Button>
          </form>

          <p className="mt-8 text-xs leading-6 text-muted-foreground">
            پس از ۵ تلاش ناموفق، ورود به حساب برای مدتی قفل می‌شود. اگر رمز عبور را فراموش کرده‌اید با مدیر ارشد تماس بگیرید.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-soil text-soil-foreground lg:block">
        <div aria-hidden className="absolute top-[30%] left-1/2 size-28 -translate-x-1/2 rounded-full bg-wheat/90 blur-[1px]" />
        <div aria-hidden className="absolute top-[30%] left-1/2 size-72 -translate-x-1/2 -translate-y-[35%] rounded-full bg-wheat/10 blur-3xl" />
        <div aria-hidden className="absolute inset-x-0 top-[38%] h-px bg-soil-foreground/15" />
        <FieldRows />
        <div className="relative flex h-full flex-col justify-between p-12">
          <p className="text-sm text-soil-muted">پلتفرم خدمات کشاورزی</p>
          <div className="max-w-md">
            <p className="text-[34px] leading-[1.35] font-extrabold tracking-tight">
              کاربران، خدمات‌دهندگان و درخواست‌ها را از یک جا اداره کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
