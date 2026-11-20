"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter } from "@/components/admin/ui/dialog";
import { Field, Input, NativeSelect } from "@/components/admin/ui/input";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { adminApi } from "@/lib/admin/api";

interface CityOption {
  cityId: string;
  name: string;
}

export interface EditableUser {
  cityId: string | null;
  id: string;
  name: string;
  phone: string;
  provinceId: string | null;
}

export function UserEditDialog({
  onOpenChange,
  open,
  provinces,
  user,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  provinces: Array<{ id: string; name: string }>;
  user: EditableUser;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent description="تغییرات در تاریخچه مدیریتی کاربر ثبت می‌شود." title="ویرایش اطلاعات کاربر">
        {/* Mounted only while open, so every open starts from the saved values. */}
        <UserEditForm onDone={() => onOpenChange(false)} provinces={provinces} user={user} />
      </DialogContent>
    </Dialog>
  );
}

function UserEditForm({
  onDone,
  provinces,
  user,
}: {
  onDone: () => void;
  provinces: Array<{ id: string; name: string }>;
  user: EditableUser;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [provinceId, setProvinceId] = useState(user.provinceId ?? "");
  const [cityId, setCityId] = useState(user.cityId ?? "");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(Boolean(user.provinceId));
  const action = useAdminAction();

  useEffect(() => {
    if (!provinceId) return;
    const controller = new AbortController();
    fetch(`/api/app/v1/locations/provinces/${provinceId}/cities`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { data?: { cities?: CityOption[] } }) => setCities(payload.data?.cities ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setCities([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCitiesLoading(false);
      });
    return () => controller.abort();
  }, [provinceId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = await action.run(
      () =>
        adminApi.patch(`/users/${user.id}`, {
          cityId: cityId ? Number(cityId) : null,
          name,
          phone,
          provinceId: provinceId ? Number(provinceId) : null,
        }),
      "اطلاعات کاربر ذخیره شد.",
    );
    if (ok) onDone();
  }

  const phoneChanged = phone.replace(/\D/g, "") !== user.phone && phone.trim() !== "";

  return (
    <form noValidate onSubmit={submit}>
      <DialogBody>
        <Field error={action.errors.name} htmlFor="edit-name" label="نام و نام خانوادگی">
          <Input
            aria-invalid={Boolean(action.errors.name)}
            id="edit-name"
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </Field>
        <Field
          error={action.errors.phone}
          hint={phoneChanged ? "با تغییر شماره، کاربر از همه دستگاه‌ها خارج می‌شود و باید با شماره جدید وارد شود." : undefined}
          htmlFor="edit-phone"
          label="شماره موبایل"
        >
          <Input
            aria-invalid={Boolean(action.errors.phone)}
            className="text-left"
            dir="ltr"
            id="edit-phone"
            inputMode="tel"
            onChange={(event) => setPhone(event.target.value)}
            value={phone}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field error={action.errors.provinceId} htmlFor="edit-province" label="استان">
            <NativeSelect
              id="edit-province"
              onChange={(event) => {
                setProvinceId(event.target.value);
                setCityId("");
                setCities([]);
                setCitiesLoading(Boolean(event.target.value));
              }}
              value={provinceId}
            >
              <option value="">انتخاب نشده</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field error={action.errors.cityId} htmlFor="edit-city" label="شهر">
            <NativeSelect
              disabled={!provinceId || citiesLoading}
              id="edit-city"
              onChange={(event) => setCityId(event.target.value)}
              value={cityId}
            >
              <option value="">{citiesLoading ? "در حال بارگذاری…" : "انتخاب نشده"}</option>
              {cities.map((city) => (
                <option key={city.cityId} value={city.cityId}>
                  {city.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button onClick={onDone} type="button" variant="ghost">
          انصراف
        </Button>
        <Button loading={action.pending} type="submit">
          ذخیره تغییرات
        </Button>
      </DialogFooter>
    </form>
  );
}
