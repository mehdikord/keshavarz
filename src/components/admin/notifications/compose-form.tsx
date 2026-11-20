"use client";

import { Bell, CircleAlert, LoaderCircle, Search, Send, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/admin/ui/avatar";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { controlClass, Field, Input, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { PhoneText } from "@/components/admin/ui/ltr";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi, errorMessage } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { cn } from "@/lib/utils";
import type { AudiencePreview } from "@/server/modules/admin/notifications/notifications-admin.service";

import { AUDIENCE_OPTIONS, audienceLabel, DEEP_LINK_OPTIONS } from "./notification-labels";

type AudienceKind = (typeof AUDIENCE_OPTIONS)[number]["key"];

interface Recipient {
  id: string;
  image: string | null;
  isProvider: boolean;
  name: string;
  phone: string;
}

const TITLE_MAX = 200;
const BODY_MAX = 1500;

export function ComposeForm({
  initialUser,
  provinces,
}: {
  /** Pre-selected recipient, e.g. when opened from a user's page with `?user=`. */
  initialUser?: Recipient | null;
  provinces: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<AudienceKind>(initialUser ? "user" : "all");
  const [user, setUser] = useState<Recipient | null>(initialUser ?? null);
  const [provinceId, setProvinceId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [confirming, setConfirming] = useState(false);
  const action = useAdminAction();

  const audience =
    kind === "user"
      ? user
        ? { kind, userId: user.id }
        : null
      : kind === "province"
        ? provinceId
          ? { kind, provinceId: Number(provinceId) }
          : null
        : { kind };
  const audienceKey = audience ? JSON.stringify(audience) : null;

  // Recipient count for the current audience; stale results are ignored by key.
  const [preview, setPreview] = useState<{ data?: AudiencePreview; error?: string; key: string } | null>(null);
  useEffect(() => {
    if (!audienceKey) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await adminApi.post<AudiencePreview>("/notifications/audience", { audience: JSON.parse(audienceKey) });
        if (!cancelled) setPreview({ data, key: audienceKey });
      } catch (error) {
        if (!cancelled) setPreview({ error: errorMessage(error), key: audienceKey });
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [audienceKey]);

  const current = preview && preview.key === audienceKey ? preview : null;
  const count = current?.data?.count ?? null;
  const counting = Boolean(audienceKey) && !current;

  const provinceName = provinces.find((province) => province.id === provinceId)?.name ?? null;
  const label = audienceLabel({ kind, provinceName, userName: user?.name ?? null });
  const canSend = Boolean(audience) && (count ?? 0) > 0 && title.trim().length >= 2 && body.trim().length >= 5;

  async function send() {
    if (!audience || count === null) return;
    let campaignId: string | null = null;
    const ok = await action.run(async () => {
      const result = await adminApi.post<{ campaignId: string; sent: number }>("/notifications/broadcasts", {
        audience,
        body,
        deepLink: deepLink || null,
        expectedRecipients: count,
        title,
      });
      campaignId = result.campaignId;
    }, `اعلان برای ${faNumber(count)} نفر ارسال شد.`);
    setConfirming(false);
    if (ok && campaignId) router.push(`/admins/notifications/campaigns/${campaignId}`);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-5">
        <Panel>
          <PanelHeader description="اعلان در بخش اعلان‌های اپلیکیشن هر گیرنده نمایش داده می‌شود." title="گیرندگان" />
          <div className="grid gap-4 px-5 pb-5">
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="گیرندگان">
              {AUDIENCE_OPTIONS.map((option) => {
                const selected = option.key === kind;
                return (
                  <button
                    aria-checked={selected}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3.5 py-3 text-start transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected ? "border-primary bg-primary/[0.06]" : "border-border hover:border-input hover:bg-raised",
                    )}
                    key={option.key}
                    onClick={() => setKind(option.key)}
                    role="radio"
                    type="button"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                        selected ? "border-primary" : "border-input",
                      )}
                    >
                      {selected ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold">{option.label}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-5 text-muted-foreground">{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {kind === "user" ? (
              <RecipientPicker error={action.errors["audience.userId"]} onChange={setUser} value={user} />
            ) : null}
            {kind === "province" ? (
              <Field error={action.errors["audience.provinceId"]} htmlFor="compose-province" label="استان">
                <NativeSelect id="compose-province" onChange={(event) => setProvinceId(event.target.value)} value={provinceId}>
                  <option value="">انتخاب استان</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="متن اعلان" />
          <div className="grid gap-4 px-5 pb-5">
            <Field
              error={action.errors.title}
              hint={`${faNumber(title.length)} از ${faNumber(TITLE_MAX)} نویسه`}
              htmlFor="compose-title"
              label="عنوان"
            >
              <Input
                aria-invalid={Boolean(action.errors.title)}
                id="compose-title"
                maxLength={TITLE_MAX}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="مثلاً فصل کاشت گندم آغاز شد"
                value={title}
              />
            </Field>
            <Field
              error={action.errors.body}
              hint={`${faNumber(body.length)} از ${faNumber(BODY_MAX)} نویسه`}
              htmlFor="compose-body"
              label="متن"
            >
              <Textarea
                aria-invalid={Boolean(action.errors.body)}
                id="compose-body"
                maxLength={BODY_MAX}
                onChange={(event) => setBody(event.target.value)}
                placeholder="پیامی که گیرنده می‌خواند. کوتاه و روشن بنویسید."
                rows={5}
                value={body}
              />
            </Field>
            <Field
              error={action.errors.deepLink}
              hint="با زدن روی اعلان، این صفحه از اپلیکیشن باز می‌شود. خالی: صفحه خانه گیرنده."
              htmlFor="compose-link"
              label="صفحه مقصد (اختیاری)"
            >
              <NativeSelect id="compose-link" onChange={(event) => setDeepLink(event.target.value)} value={deepLink}>
                <option value="">بدون پیوند</option>
                {["خدمات‌گیرنده", "خدمات‌دهنده", "عمومی"].map((group) => (
                  <optgroup key={group} label={group}>
                    {DEEP_LINK_OPTIONS.filter((option) => option.group === group).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </NativeSelect>
            </Field>
            <p className="flex items-start gap-2 rounded-xl bg-info-soft px-3.5 py-2.5 text-[12px] leading-6 text-info">
              <CircleAlert className="mt-1 size-4 shrink-0" />
              اعلان فقط درون اپلیکیشن ارسال می‌شود؛ ارسال پیامک برای اعلان‌ها هنوز در سامانه پیکربندی نشده است.
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:sticky xl:top-20">
        <Panel>
          <PanelHeader title="پیش‌نمایش" />
          <div className="px-5 pb-5">
            <div className="rounded-[22px] bg-[linear-gradient(160deg,#fff6e6,#f5ead8)] p-3">
              <div className="flex items-start gap-3 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-black/5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f1e2] text-[#3f7d45]">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold text-[#3b2410]">{title.trim() || "عنوان اعلان"}</p>
                  <p className="mt-0.5 line-clamp-4 text-[12px] leading-5 whitespace-pre-line text-[#6b4a26]">
                    {body.trim() || "متن اعلان اینجا دیده می‌شود."}
                  </p>
                  <p className="mt-1.5 text-[10.5px] text-[#a08463]">همین حالا</p>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="grid gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wheat-soft text-wheat-ink">
                <UsersRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[12px] text-muted-foreground">{label}</p>
                <p aria-live="polite" className="text-[18px] font-extrabold tabular-nums">
                  {!audience ? (
                    <span className="text-[13px] font-semibold text-muted-foreground">گیرنده را مشخص کنید</span>
                  ) : counting ? (
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                  ) : current?.error ? (
                    <span className="text-[13px] font-semibold text-danger">{current.error}</span>
                  ) : (
                    `${faNumber(count ?? 0)} گیرنده`
                  )}
                </p>
              </div>
            </div>
            {current?.data && current.data.sample.length > 0 && kind !== "user" ? (
              <p className="text-[11.5px] leading-5 text-muted-foreground">
                از جمله: {current.data.sample.map((person) => person.name).join("، ")}
                {current.data.count > current.data.sample.length ? " و …" : ""}
              </p>
            ) : null}
            {count === 0 && audience && !counting ? (
              <p className="text-[12px] text-warn">این مخاطبان در حال حاضر گیرنده‌ای ندارند.</p>
            ) : null}
            <Button disabled={!canSend || counting} onClick={() => setConfirming(true)} size="lg">
              <Send />
              بررسی و ارسال
            </Button>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        confirm={`ارسال برای ${faNumber(count ?? 0)} نفر`}
        description="پس از ارسال، اعلان بلافاصله در اپلیکیشن گیرندگان دیده می‌شود و قابل پس گرفتن نیست."
        onConfirm={() => void send()}
        onOpenChange={setConfirming}
        open={confirming}
        pending={action.pending}
        title="ارسال اعلان"
        tone="primary"
      >
        <dl className="grid gap-2 rounded-xl border border-line bg-raised p-3 text-[12.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">گیرندگان</dt>
            <dd className="font-semibold">{label}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">تعداد</dt>
            <dd className="font-semibold tabular-nums">{faNumber(count ?? 0)} نفر</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">عنوان</dt>
            <dd className="truncate font-semibold">{title}</dd>
          </div>
        </dl>
      </ConfirmDialog>
    </div>
  );
}

function RecipientPicker({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (recipient: Recipient | null) => void;
  value: Recipient | null;
}) {
  const [query, setQuery] = useState("");
  // Results remember the query they answer, so a stale list is never shown for new text.
  const [found, setFound] = useState<{ items: Recipient[]; q: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = await adminApi.get<Recipient[]>("/notifications/recipients", { q }, controller.signal);
        setFound({ items, q });
      } catch {
        if (!controller.signal.aborted) setFound({ items: [], q });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/[0.04] px-3 py-2.5">
        <Avatar image={value.image} name={value.name} seed={value.id} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{value.name}</p>
          <p className="text-[11.5px] text-muted-foreground">
            <PhoneText phone={value.phone} /> · {value.isProvider ? "خدمات‌دهنده" : "خدمات‌گیرنده"}
          </p>
        </div>
        <Button aria-label="تغییر گیرنده" onClick={() => onChange(null)} size="icon-sm" type="button" variant="ghost">
          <X />
        </Button>
      </div>
    );
  }

  const q = query.trim();
  const results = found && found.q === q ? found.items : [];
  return (
    <div className="grid gap-1.5">
      <label className="text-[12.5px] font-semibold text-foreground/85" htmlFor="compose-recipient">
        جستجوی گیرنده
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className={cn(controlClass, "h-10 pr-9")}
          id="compose-recipient"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام، شماره موبایل یا شناسه کاربر"
          type="search"
          value={query}
        />
        {loading ? <LoaderCircle className="absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {q.length >= 2 && !loading && found?.q === q && results.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">کاربری با این مشخصات پیدا نشد.</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="grid gap-0.5 rounded-xl border border-border bg-card p-1">
          {results.map((recipient) => (
            <li key={recipient.id}>
              <button
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => onChange(recipient)}
                type="button"
              >
                <Avatar image={recipient.image} name={recipient.name} seed={recipient.id} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{recipient.name}</span>
                  <span className="block text-[11.5px] text-muted-foreground">
                    <PhoneText phone={recipient.phone} />
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground">{recipient.isProvider ? "خدمات‌دهنده" : "خدمات‌گیرنده"}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
