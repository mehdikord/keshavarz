"use client";

import { ExternalLink, MapPinOff, Radar, RotateCcw } from "lucide-react";
import { useState } from "react";

import { useCan } from "@/components/admin/shell/admin-context";
import { Button } from "@/components/admin/ui/button";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { Field, Input } from "@/components/admin/ui/input";
import { Panel, PanelHeader } from "@/components/admin/ui/panel";
import { useAdminAction } from "@/components/admin/ui/use-admin-action";
import { MapPicker } from "@/components/shared/map-picker";
import { adminApi } from "@/lib/admin/api";
import { faNumber } from "@/lib/admin/format";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

const MIN_RADIUS = 20;
const MAX_RADIUS = 100;
const PRESETS = [20, 30, 50, 75, 100];

const toLatin = (value: string) =>
  value.replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0)).replace(/٫/g, ".");

function parseCoordinate(value: string, limit: number): number | null {
  const trimmed = toLatin(value.trim());
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Math.abs(number) <= limit ? number : null;
}

export function WorkAreaEditor({
  id,
  latitude,
  longitude,
  radiusKm,
}: {
  id: string;
  latitude: string | null;
  longitude: string | null;
  radiusKm: number;
}) {
  const canUpdate = useCan(ADMIN_PERMISSIONS.providersUpdate);
  const [lat, setLat] = useState(latitude ?? "");
  const [lng, setLng] = useState(longitude ?? "");
  const [radius, setRadius] = useState(radiusKm);
  const [clearing, setClearing] = useState(false);
  const action = useAdminAction();

  const parsedLat = parseCoordinate(lat, 90);
  const parsedLng = parseCoordinate(lng, 180);
  const location = parsedLat !== null && parsedLng !== null ? { lat: parsedLat, lng: parsedLng } : null;
  const configured = latitude !== null && longitude !== null;
  const dirty =
    radius !== radiusKm ||
    (location
      ? !configured || Math.abs(location.lat - Number(latitude)) > 1e-7 || Math.abs(location.lng - Number(longitude)) > 1e-7
      : false);
  const incomplete = (lat.trim() !== "" || lng.trim() !== "") && !location;

  async function save() {
    if (!location) return;
    await action.run(
      () =>
        adminApi.patch(`/providers/${id}/work-area`, {
          workLatitude: location.lat,
          workLongitude: location.lng,
          workRadiusKm: radius,
        }),
      "محدوده کاری ذخیره شد.",
    );
  }

  async function clear() {
    const ok = await action.run(
      () => adminApi.patch(`/providers/${id}/work-area`, { workLatitude: null, workLongitude: null, workRadiusKm: radius }),
      "موقعیت کاری حذف شد.",
    );
    if (ok) {
      setLat("");
      setLng("");
      setClearing(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="overflow-hidden">
        <PanelHeader
          description={
            canUpdate
              ? "نقشه را بکشید تا پین روی مرکز فعالیت خدمات‌دهنده (محل استقرار ادوات یا روستا) قرار بگیرد، یا مختصات را دستی وارد کنید."
              : "مرکز فعالیت خدمات‌دهنده"
          }
          title="موقعیت کاری"
        />
        <div className="px-4 pb-4">
          <MapPicker
            interactive={canUpdate}
            onChange={(next) => {
              setLat(next.lat.toFixed(7));
              setLng(next.lng.toFixed(7));
            }}
            value={location}
          />
        </div>
      </Panel>

      <div className="grid content-start gap-5">
        <Panel>
          <PanelHeader title="مختصات مرکز" />
          <div className="grid gap-3 px-5 pb-5">
            <div className="grid grid-cols-2 gap-3">
              <Field error={action.errors.workLatitude} htmlFor="work-lat" label="عرض جغرافیایی">
                <Input
                  aria-invalid={Boolean(action.errors.workLatitude) || (lat.trim() !== "" && parsedLat === null)}
                  className="text-left font-mono text-[12.5px]"
                  dir="ltr"
                  disabled={!canUpdate}
                  id="work-lat"
                  inputMode="decimal"
                  onChange={(event) => setLat(event.target.value)}
                  placeholder="35.6892"
                  value={lat}
                />
              </Field>
              <Field error={action.errors.workLongitude} htmlFor="work-lng" label="طول جغرافیایی">
                <Input
                  aria-invalid={Boolean(action.errors.workLongitude) || (lng.trim() !== "" && parsedLng === null)}
                  className="text-left font-mono text-[12.5px]"
                  dir="ltr"
                  disabled={!canUpdate}
                  id="work-lng"
                  inputMode="decimal"
                  onChange={(event) => setLng(event.target.value)}
                  placeholder="51.3890"
                  value={lng}
                />
              </Field>
            </div>
            {incomplete ? (
              <p className="text-xs text-danger" role="alert">
                هر دو مختصات را به‌صورت عدد وارد کنید (عرض بین ۹۰- و ۹۰، طول بین ۱۸۰- و ۱۸۰).
              </p>
            ) : !location ? (
              <p className="flex items-center gap-1.5 text-xs text-warn">
                <MapPinOff className="size-3.5" />
                موقعیت ثبت نشده؛ خدمات‌دهنده در جستجو دیده نمی‌شود.
              </p>
            ) : (
              <a
                className="inline-flex items-center gap-1 text-xs font-semibold text-info hover:underline"
                href={`https://neshan.org/maps/@${location.lat},${location.lng},13z`}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="size-3.5" />
                باز کردن در نقشه نشان
              </a>
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            description={`پوشش تقریبی ${faNumber(Math.round(Math.PI * radius * radius))} کیلومتر مربع`}
            title={
              <span className="flex items-center gap-1.5">
                <Radar className="size-4 text-primary" />
                شعاع پوشش
              </span>
            }
            action={
              <p className="text-left">
                <span className="text-2xl leading-none font-extrabold tabular-nums">{faNumber(radius)}</span>
                <span className="ms-1 text-[11px] text-muted-foreground">کیلومتر</span>
              </p>
            }
          />
          <div className="grid gap-3 px-5 pb-5">
            <input
              aria-label="شعاع پوشش (کیلومتر)"
              className="w-full accent-[var(--primary)]"
              dir="ltr"
              disabled={!canUpdate}
              max={MAX_RADIUS}
              min={MIN_RADIUS}
              onChange={(event) => setRadius(Number(event.target.value))}
              step={5}
              type="range"
              value={radius}
            />
            <div className="grid grid-cols-5 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  aria-pressed={radius === preset}
                  className={cn(
                    "h-8 rounded-lg text-[12px] font-bold tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                    radius === preset ? "bg-soil text-soil-foreground" : "bg-muted text-foreground/75 hover:bg-muted/70",
                  )}
                  disabled={!canUpdate}
                  key={preset}
                  onClick={() => setRadius(preset)}
                  type="button"
                >
                  {faNumber(preset)}
                </button>
              ))}
            </div>
            {action.errors.workRadiusKm ? <p className="text-xs text-danger">{action.errors.workRadiusKm}</p> : null}
            <p className="text-[11.5px] leading-5 text-muted-foreground">
              کشاورزانی که زمینشان در این فاصله از مرکز باشد، این خدمات‌دهنده را در جستجو می‌بینند (بین ۲۰ تا ۱۰۰ کیلومتر).
            </p>
          </div>
        </Panel>

        {canUpdate ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button className="flex-1" disabled={!location || !dirty} loading={action.pending} onClick={() => void save()}>
              ذخیره محدوده کاری
            </Button>
            {dirty ? (
              <Button
                onClick={() => {
                  setLat(latitude ?? "");
                  setLng(longitude ?? "");
                  setRadius(radiusKm);
                  action.reset();
                }}
                variant="ghost"
              >
                <RotateCcw />
                بازگرداندن
              </Button>
            ) : null}
            {configured ? (
              <Button onClick={() => setClearing(true)} variant="danger-soft">
                <MapPinOff />
                حذف موقعیت
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        confirm="حذف موقعیت"
        description="با حذف موقعیت کاری، خدمات‌دهنده تا ثبت دوباره موقعیت در جستجوی کشاورزان دیده نمی‌شود."
        onConfirm={() => void clear()}
        onOpenChange={setClearing}
        open={clearing}
        pending={action.pending}
        title="حذف موقعیت کاری"
      />
    </div>
  );
}
