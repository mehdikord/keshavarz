"use client";

import { Check, Eye, EyeOff, LogOut } from "lucide-react";
import { useState } from "react";

import { type SessionRow, SessionsTable } from "@/components/admin/team/sessions-table";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Field, Input } from "@/components/admin/ui/input";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

export function ProfileForm({ email: initialEmail, name: initialName }: { email: string | null; name: string }) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const action = useAdminAction();
  const dirty = name !== initialName || (email.trim() || null) !== (initialEmail || null);

  return (
    <Panel className="pb-5">
      <PanelHeader description="شماره موبایل نام کاربری ورود است و فقط مدیر دیگری می‌تواند آن را تغییر دهد." title="مشخصات" />
      <form
        className="grid gap-4 px-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(() => adminApi.patch("/account", { email: email.trim() || null, name }), "مشخصات ذخیره شد.");
        }}
      >
        <Field error={action.errors.name} htmlFor="account-name" label="نام و نام خانوادگی">
          <Input aria-invalid={Boolean(action.errors.name)} id="account-name" maxLength={120} onChange={(event) => setName(event.target.value)} value={name} />
        </Field>
        <Field error={action.errors.email} hint="اختیاری" htmlFor="account-email" label="ایمیل">
          <Input
            aria-invalid={Boolean(action.errors.email)}
            className="text-left"
            dir="ltr"
            id="account-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            value={email}
          />
        </Field>
        <div>
          <Button disabled={!dirty} loading={action.pending} type="submit">
            ذخیره مشخصات
          </Button>
        </div>
      </form>
    </Panel>
  );
}

const RULES = [
  { label: "حداقل ۱۲ نویسه", test: (value: string) => value.length >= 12 },
  { label: "دست‌کم یک حرف", test: (value: string) => /[A-Za-z؀-ۿ]/.test(value) },
  { label: "دست‌کم یک عدد", test: (value: string) => /[0-9۰-۹]/.test(value) },
];

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const action = useAdminAction();
  const mismatch = repeat.length > 0 && next !== repeat;
  const valid = RULES.every((rule) => rule.test(next)) && next === repeat && current.length > 0;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(
      () => adminApi.post("/account/password", { currentPassword: current, newPassword: next }),
      "رمز عبور تغییر کرد و دستگاه‌های دیگر خارج شدند.",
    );
    if (ok) {
      setCurrent("");
      setNext("");
      setRepeat("");
    }
  }

  const type = show ? "text" : "password";
  return (
    <Panel className="pb-5">
      <PanelHeader
        action={
          <Button aria-label={show ? "پنهان کردن رمزها" : "نمایش رمزها"} onClick={() => setShow(!show)} size="icon-sm" type="button" variant="ghost">
            {show ? <EyeOff /> : <Eye />}
          </Button>
        }
        description="پس از تغییر، از همه دستگاه‌های دیگر خارج می‌شوید؛ همین نشست باز می‌ماند."
        title="تغییر رمز عبور"
      />
      <form className="grid gap-4 px-5" noValidate onSubmit={submit}>
        <Field error={action.errors.currentPassword} htmlFor="current-password" label="رمز عبور فعلی">
          <Input
            aria-invalid={Boolean(action.errors.currentPassword)}
            autoComplete="current-password"
            className="text-left"
            dir="ltr"
            id="current-password"
            onChange={(event) => setCurrent(event.target.value)}
            type={type}
            value={current}
          />
        </Field>
        <Field error={action.errors.newPassword} htmlFor="new-password" label="رمز عبور جدید">
          <Input
            aria-invalid={Boolean(action.errors.newPassword)}
            autoComplete="new-password"
            className="text-left"
            dir="ltr"
            id="new-password"
            onChange={(event) => setNext(event.target.value)}
            type={type}
            value={next}
          />
        </Field>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
          {RULES.map((rule) => {
            const ok = rule.test(next);
            return (
              <li className={cn("flex items-center gap-1", ok ? "text-ok" : "text-muted-foreground")} key={rule.label}>
                <Check className={cn("size-3.5", !ok && "opacity-30")} />
                {rule.label}
              </li>
            );
          })}
        </ul>
        <Field error={mismatch ? "تکرار با رمز جدید یکی نیست." : undefined} htmlFor="repeat-password" label="تکرار رمز عبور جدید">
          <Input
            aria-invalid={mismatch}
            autoComplete="new-password"
            className="text-left"
            dir="ltr"
            id="repeat-password"
            onChange={(event) => setRepeat(event.target.value)}
            type={type}
            value={repeat}
          />
        </Field>
        <div>
          <Button disabled={!valid} loading={action.pending} type="submit">
            تغییر رمز عبور
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export function OwnSessionsPanel({ now, sessions }: { now: string; sessions: SessionRow[] }) {
  const [confirming, setConfirming] = useState(false);
  const action = useAdminAction();
  const others = sessions.filter((row) => row.isActive && !row.current).length;
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        action={
          others > 0 ? (
            <Button onClick={() => setConfirming(true)} size="sm" variant="danger-soft">
              <LogOut />
              خروج از دستگاه‌های دیگر
            </Button>
          ) : null
        }
        description="اگر دستگاهی را نمی‌شناسید، آن را ببندید و رمز عبورتان را عوض کنید."
        title="نشست‌ها و دستگاه‌ها"
      />
      <div className="border-t border-line">
        <SessionsTable now={new Date(now)} onRevoke={(sessionId) => adminApi.post("/account/sessions/revoke", { sessionId })} sessions={sessions} />
      </div>
      <ConfirmDialog
        confirm="خروج از همه"
        description="همه نشست‌های شما به‌جز همین دستگاه بسته می‌شود."
        onConfirm={() => {
          void action.run(() => adminApi.post("/account/sessions/revoke", { others: true }), "از دستگاه‌های دیگر خارج شدید.").then((ok) => ok && setConfirming(false));
        }}
        onOpenChange={setConfirming}
        open={confirming}
        pending={action.pending}
        title="خروج از دستگاه‌های دیگر"
      />
    </Panel>
  );
}
