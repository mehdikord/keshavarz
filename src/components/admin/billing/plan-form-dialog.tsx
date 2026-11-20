"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { toLatinDigits } from "@/components/admin/catalog/image-field";
import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, Textarea } from "@/components/admin/ui/input";
import { Switch } from "@/components/admin/ui/switch";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";
import { faNumber, formatToman } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import type { AdminPlanItem } from "@/server/modules/admin/billing/billing.service";

export type PlanDialogMode = { kind: "create" } | { kind: "edit"; plan: AdminPlanItem };

export function PlanFormDialog({ mode, onOpenChange }: { mode: PlanDialogMode | null; onOpenChange: (open: boolean) => void }) {
  const editing = mode?.kind === "edit";
  return (
    <Dialog onOpenChange={onOpenChange} open={mode !== null}>
      <DialogContent
        description={
          editing
            ? "تغییر قیمت و مدت فقط روی خریدهای بعدی اثر دارد؛ اشتراک‌های فعلی با شرایط زمان خرید ادامه می‌یابند."
            : "پلن فعال بلافاصله در صفحه خرید اشتراک خدمات‌دهندگان نمایش داده می‌شود."
        }
        size="lg"
        title={editing ? "ویرایش پلن" : "افزودن پلن اشتراک"}
      >
        {mode ? <PlanForm key={mode.kind === "edit" ? mode.plan.id : "create"} mode={mode} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

export function AddPlanButton() {
  const canManage = useCan(ADMIN_PERMISSIONS.subscriptionsManage);
  const [mode, setMode] = useState<PlanDialogMode | null>(null);
  if (!canManage) return null;
  return (
    <>
      <Button onClick={() => setMode({ kind: "create" })}>
        <Plus />
        افزودن پلن
      </Button>
      <PlanFormDialog mode={mode} onOpenChange={(open) => !open && setMode(null)} />
    </>
  );
}

function PlanForm({ mode, onDone }: { mode: PlanDialogMode; onDone: () => void }) {
  const plan = mode.kind === "edit" ? mode.plan : null;
  const [name, setName] = useState(plan?.name ?? "");
  const [code, setCode] = useState(plan?.code ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [durationMonths, setDurationMonths] = useState(plan ? String(plan.durationMonths) : "1");
  const [priceToman, setPriceToman] = useState(plan ? String(plan.priceToman) : "");
  const [features, setFeatures] = useState<string[]>(plan?.features.length ? plan.features : [""]);
  const [isActive, setIsActive] = useState(plan?.isActive ?? true);
  const [isRecommended, setIsRecommended] = useState(plan?.isRecommended ?? false);
  const action = useAdminAction();

  const price = Number(priceToman || 0);
  const months = Number(durationMonths || 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = {
      description: description.trim() || null,
      durationMonths: months,
      features: features.map((feature) => feature.trim()).filter(Boolean),
      isActive,
      isRecommended,
      name,
      priceToman: price,
    };
    const ok = await action.run(
      () => (plan ? adminApi.patch(`/billing/plans/${plan.id}`, body) : adminApi.post("/billing/plans", { ...body, code })),
      plan ? "پلن ذخیره شد." : "پلن جدید اضافه شد.",
    );
    if (ok) onDone();
  }

  const featureError = Object.entries(action.errors).find(([key]) => key.startsWith("features"))?.[1];

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={action.errors.name} htmlFor="plan-name" label="نام پلن">
            <Input
              aria-invalid={Boolean(action.errors.name)}
              autoFocus={!plan}
              id="plan-name"
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً اشتراک سه‌ماهه"
              value={name}
            />
          </Field>
          <Field
            error={action.errors.code}
            hint={plan ? "کد پس از ساخت تغییر نمی‌کند؛ اپلیکیشن خرید را با آن انجام می‌دهد." : "حروف کوچک انگلیسی، عدد، - و _"}
            htmlFor="plan-code"
            label="کد پلن"
          >
            <Input
              aria-invalid={Boolean(action.errors.code)}
              className="text-left font-mono text-[12.5px]"
              dir="ltr"
              disabled={Boolean(plan)}
              id="plan-code"
              maxLength={80}
              onChange={(event) => setCode(event.target.value)}
              placeholder="quarterly"
              value={code}
            />
          </Field>
          <Field error={action.errors.durationMonths} htmlFor="plan-duration" label="مدت (ماه)">
            <Input
              aria-invalid={Boolean(action.errors.durationMonths)}
              className="text-left"
              dir="ltr"
              id="plan-duration"
              inputMode="numeric"
              onChange={(event) => setDurationMonths(toLatinDigits(event.target.value).slice(0, 2))}
              value={durationMonths}
            />
          </Field>
          <Field
            error={action.errors.priceToman}
            hint={price > 0 ? `${formatToman(price)}${months > 0 ? ` — ماهانه حدود ${formatToman(Math.round(price / months))}` : ""}` : undefined}
            htmlFor="plan-price"
            label="قیمت (تومان)"
          >
            <Input
              aria-invalid={Boolean(action.errors.priceToman)}
              className="text-left"
              dir="ltr"
              id="plan-price"
              inputMode="numeric"
              onChange={(event) => setPriceToman(toLatinDigits(event.target.value).slice(0, 11))}
              value={priceToman}
            />
          </Field>
        </div>
        <Field error={action.errors.description} hint="اختیاری؛ زیر نام پلن در اپلیکیشن." htmlFor="plan-description" label="توضیحات">
          <Textarea
            id="plan-description"
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            value={description}
          />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[12.5px] font-semibold text-foreground/85">ویژگی‌ها</legend>
          {features.map((feature, index) => (
            <div className="flex items-center gap-2" key={index}>
              <Input
                aria-label={`ویژگی ${faNumber(index + 1)}`}
                maxLength={120}
                onChange={(event) => setFeatures(features.map((item, at) => (at === index ? event.target.value : item)))}
                placeholder="مثلاً نمایش در نتایج جستجو"
                value={feature}
              />
              <Button
                aria-label={`حذف ویژگی ${faNumber(index + 1)}`}
                disabled={features.length === 1 && !feature}
                onClick={() => setFeatures(features.length === 1 ? [""] : features.filter((_, at) => at !== index))}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          {features.length < 12 ? (
            <Button className="justify-self-start" onClick={() => setFeatures([...features, ""])} size="sm" type="button" variant="soft">
              <Plus />
              افزودن ویژگی
            </Button>
          ) : null}
          {featureError ? <p className="text-xs text-danger">{featureError}</p> : null}
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <div>
              <label className="text-[13px] font-semibold" htmlFor="plan-active">
                قابل خرید
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">نمایش در صفحه خرید اشتراک</p>
            </div>
            <Switch checked={isActive} id="plan-active" onCheckedChange={setIsActive} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
            <div>
              <label className="text-[13px] font-semibold" htmlFor="plan-recommended">
                پیشنهاد ویژه
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">برچسب «پیشنهادی» در اپلیکیشن</p>
            </div>
            <Switch checked={isRecommended} id="plan-recommended" onCheckedChange={setIsRecommended} />
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit">
          {plan ? "ذخیره تغییرات" : "افزودن پلن"}
        </Button>
      </DialogFooter>
    </form>
  );
}
