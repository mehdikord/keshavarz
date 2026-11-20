"use client";

import { Gift, LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Avatar } from "@/components/admin/ui/avatar";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { controlClass, Field, NativeSelect, Textarea } from "@/components/admin/ui/input";
import { PhoneText } from "@/components/admin/ui/ltr";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatDate, formatToman } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import type { ProviderLookupItem } from "@/server/modules/admin/billing/billing.service";

import { DurationField, durationPayload, type DurationValue } from "./duration-field";

export interface GrantPlanOption {
  durationMonths: number;
  id: string;
  isActive: boolean;
  name: string;
  priceToman: number;
}

/** A provider fixed by the caller (e.g. the provider detail page). */
export interface GrantProvider {
  activePlan?: string | null;
  activeUntil?: string | null;
  /** The provider's user public id. */
  id: string;
  image?: string | null;
  name: string;
  phone: string;
}

/**
 * Grants a free subscription. Without `provider` the dialog starts with a
 * provider search; with it, the provider is fixed. Remaining time of a running
 * subscription is carried over (the server adds the new period to it).
 */
export function GrantSubscriptionDialog({
  onOpenChange,
  open,
  plans,
  provider,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  plans: GrantPlanOption[];
  provider?: GrantProvider;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        description="اشتراک رایگان و بلافاصله فعال می‌شود و به خدمات‌دهنده اعلان داده می‌شود."
        size="lg"
        title="اعطای اشتراک"
      >
        {open ? <GrantForm initialProvider={provider} onDone={() => onOpenChange(false)} plans={plans} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Button + dialog; renders nothing without the `subscriptions.grant` permission. */
export function GrantSubscriptionButton({
  label = "اعطای اشتراک",
  plans,
  provider,
  variant = "primary",
}: {
  label?: string;
  plans: GrantPlanOption[];
  provider?: GrantProvider;
  variant?: "primary" | "outline" | "soft";
}) {
  const canGrant = useCan(ADMIN_PERMISSIONS.subscriptionsGrant);
  const [open, setOpen] = useState(false);
  if (!canGrant) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant}>
        <Gift />
        {label}
      </Button>
      <GrantSubscriptionDialog onOpenChange={setOpen} open={open} plans={plans} provider={provider} />
    </>
  );
}

function GrantForm({
  initialProvider,
  onDone,
  plans,
}: {
  initialProvider?: GrantProvider;
  onDone: () => void;
  plans: GrantPlanOption[];
}) {
  const activePlans = plans.filter((plan) => plan.isActive);
  const [provider, setProvider] = useState<GrantProvider | null>(initialProvider ?? null);
  const [planId, setPlanId] = useState(activePlans[0]?.id ?? plans[0]?.id ?? "");
  const [custom, setCustom] = useState(false);
  const [duration, setDuration] = useState<DurationValue>({ amount: "30", unit: "days" });
  const [reason, setReason] = useState("");
  const action = useAdminAction();
  const plan = plans.find((option) => option.id === planId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!provider) return;
    const ok = await action.run(
      () =>
        adminApi.post("/billing/subscriptions", {
          duration: custom ? durationPayload(duration) : null,
          planId,
          providerUserId: provider.id,
          reason,
        }),
      `اشتراک برای ${provider.name} فعال شد.`,
    );
    if (ok) onDone();
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        {initialProvider ? (
          <ProviderCard provider={initialProvider} />
        ) : (
          <ProviderPicker error={action.errors.providerUserId} onChange={setProvider} value={provider} />
        )}
        {provider?.activeUntil ? (
          <p className="rounded-xl bg-info-soft px-3 py-2 text-xs leading-5 text-info">
            اشتراک «{provider.activePlan}» تا {formatDate(provider.activeUntil)} فعال است؛ مدت جدید به انتهای آن اضافه می‌شود.
          </p>
        ) : null}
        <Field error={action.errors.planId} htmlFor="grant-plan" label="پلن">
          <NativeSelect id="grant-plan" onChange={(event) => setPlanId(event.target.value)} value={planId}>
            {plans.length === 0 ? <option value="">ابتدا یک پلن بسازید</option> : null}
            {plans.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} — {faNumber(option.durationMonths)} ماه{option.isActive ? "" : " (غیرفعال)"}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[12.5px] font-semibold text-foreground/85">مدت اشتراک</legend>
          <label className="flex items-center gap-2 text-[13px]">
            <input checked={!custom} className="accent-primary" name="grant-duration" onChange={() => setCustom(false)} type="radio" />
            مطابق پلن{plan ? ` (${faNumber(plan.durationMonths)} ماه، ارزش ${formatToman(plan.priceToman)})` : ""}
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input checked={custom} className="accent-primary" name="grant-duration" onChange={() => setCustom(true)} type="radio" />
            مدت دلخواه
          </label>
          {custom ? (
            <div className="ps-6">
              <DurationField id="grant-duration-amount" invalid={Boolean(action.errors.duration)} onChange={setDuration} value={duration} />
              {action.errors.duration ? <p className="mt-1 text-xs text-danger">{action.errors.duration}</p> : null}
            </div>
          ) : null}
        </fieldset>
        <Field error={action.errors.reason} hint="در گزارش ممیزی ثبت می‌شود." htmlFor="grant-reason" label="دلیل اعطا">
          <Textarea
            aria-invalid={Boolean(action.errors.reason)}
            id="grant-reason"
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="مثلاً جبران اختلال سرویس یا طرح تشویقی"
            rows={2}
            value={reason}
          />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button disabled={!provider || !planId} loading={action.pending} type="submit">
          <Gift />
          اعطای اشتراک
        </Button>
      </DialogFooter>
    </form>
  );
}

function ProviderCard({ provider }: { provider: GrantProvider }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
      <Avatar image={provider.image ?? null} name={provider.name} seed={provider.id} size={36} />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-bold">{provider.name}</p>
        <PhoneText className="text-xs text-muted-foreground" phone={provider.phone} />
      </div>
    </div>
  );
}

function ProviderPicker({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (provider: GrantProvider | null) => void;
  value: GrantProvider | null;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProviderLookupItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await adminApi.get<ProviderLookupItem[]>("/billing/providers", { q: query.trim() || undefined }, controller.signal));
      } catch {
        if (!controller.signal.aborted) setResults([]);
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
      <div className="grid gap-1.5">
        <span className="text-[12.5px] font-semibold text-foreground/85">خدمات‌دهنده</span>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ProviderCard provider={value} />
          </div>
          <Button onClick={() => onChange(null)} size="sm" type="button" variant="ghost">
            تغییر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-[12.5px] font-semibold text-foreground/85" htmlFor={inputId}>
        خدمات‌دهنده
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-invalid={Boolean(error)}
          autoFocus
          className={cn(controlClass, "pr-9")}
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام یا شماره موبایل خدمات‌دهنده"
          type="search"
          value={query}
        />
        {loading ? (
          <LoaderCircle className="absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <ul aria-label="نتایج جستجو" className="max-h-56 overflow-y-auto rounded-xl border border-line">
        {results.length === 0 && !loading ? (
          <li className="px-3 py-4 text-center text-xs text-muted-foreground">خدمات‌دهنده‌ای پیدا نشد.</li>
        ) : null}
        {results.map((item) => (
          <li key={item.id}>
            <button
              className="flex w-full items-center gap-3 border-b border-line px-3 py-2 text-start last:border-0 hover:bg-raised focus-visible:bg-raised focus-visible:outline-none"
              onClick={() => onChange(item)}
              type="button"
            >
              <Avatar image={item.image} name={item.name} seed={item.id} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{item.name}</span>
                <PhoneText className="text-[11.5px] text-muted-foreground" phone={item.phone} />
              </span>
              {item.activeUntil ? (
                <span className="shrink-0 text-[11px] text-ok">فعال تا {formatDate(item.activeUntil)}</span>
              ) : (
                <span className="shrink-0 text-[11px] text-muted-foreground">بدون اشتراک</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
