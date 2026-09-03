"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  LoaderCircle,
  LogOut,
  MapPin,
  Search,
  Trash2,
  Tractor,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteAppMeImage,
  listAppSessions,
  revokeAppSession,
  uploadAppMeImage,
  type AppSession,
} from "@/lib/api/app-auth";
import {
  fetchAppCities,
  fetchAppProvinces,
  type AppCity,
  type AppProvince,
} from "@/lib/api/app-location";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";

function formatSessionTime(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(iso));
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const image = useAuthStore((state) => state.image);
  const logout = useAuthStore((state) => state.logout);
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName);
  const updateResidence = useAuthStore((state) => state.updateResidence);
  const refreshMe = useAuthStore((state) => state.refreshMe);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [sessions, setSessions] = useState<AppSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [busySessionId, setBusySessionId] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<AppProvince[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(true);
  const [cities, setCities] = useState<AppCity[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(
    Boolean(user?.province?.provinceId),
  );
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>(
    user?.province?.provinceId ?? "",
  );
  const [selectedCityId, setSelectedCityId] = useState<string>(
    user?.city?.cityId ?? "",
  );
  const [locationBusy, setLocationBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void listAppSessions(controller.signal)
      .then((items) => {
        if (!cancelled) setSessions(items);
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری نشستها ناموفق بود.",
        );
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void fetchAppProvinces(controller.signal)
      .then((items) => {
        if (!cancelled) setProvinces(items);
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری استانها ناموفق بود.",
        );
      })
      .finally(() => {
        if (!cancelled) setProvincesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) return;

    const controller = new AbortController();
    let cancelled = false;

    void fetchAppCities(selectedProvinceId, controller.signal)
      .then((items) => {
        if (!cancelled) setCities(items);
      })
      .catch((cause: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        toast.error(
          isApiClientError(cause)
            ? cause.message
            : "بارگذاری شهرها ناموفق بود.",
        );
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedProvinceId]);

  const handleProvinceChange = (provinceId: string) => {
    setSelectedCityId("");
    setCities([]);
    setCitiesLoading(true);
    setSelectedProvinceId(provinceId);
  };

  if (!user) return null;

  const currentDisplayName = displayName || user.displayName;

  const handleSave = async () => {
    const value = currentDisplayName.trim();

    if (value.length < 2) {
      setError("نام نمایشی باید حداقل ۲ کاراکتر باشد");
      return;
    }

    if (value === user.displayName) {
      return;
    }

    setSaving(true);
    try {
      await updateDisplayName(value);
      setError(null);
      toast.success("پروفایل به‌روزرسانی شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ذخیره پروفایل ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    if (
      selectedProvinceId === (user.province?.provinceId ?? "") &&
      selectedCityId === (user.city?.cityId ?? "")
    ) {
      return;
    }

    setLocationBusy(true);
    try {
      await updateResidence(selectedProvinceId, selectedCityId);
      toast.success("استان و شهر به‌روزرسانی شدند");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ذخیره استان و شهر ناموفق بود.",
      );
    } finally {
      setLocationBusy(false);
    }
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImageBusy(true);
    try {
      await uploadAppMeImage(file);
      await refreshMe();
      toast.success("تصویر پروفایل به‌روزرسانی شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "بارگذاری تصویر ناموفق بود.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  const handleDeleteImage = async () => {
    setImageBusy(true);
    try {
      await deleteAppMeImage();
      await refreshMe();
      toast.success("تصویر پروفایل حذف شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "حذف تصویر ناموفق بود.",
      );
    } finally {
      setImageBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      toast.info("خروج از حساب");
      router.replace("/auth");
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAll();
    } finally {
      toast.info("خروج از همه دستگاه‌ها");
      router.replace("/auth");
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setBusySessionId(sessionId);
    try {
      await revokeAppSession(sessionId);
      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId));
      toast.success("نشست لغو شد");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause) ? cause.message : "لغو نشست ناموفق بود.",
      );
    } finally {
      setBusySessionId(null);
    }
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
            <div className="relative">
              <UserAvatar name={user.displayName} src={image} size="lg" />
              {imageBusy ? (
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                  <LoaderCircle className="size-5 animate-spin text-primary" />
                </span>
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold">{user.displayName}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {user.phone}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={imageBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  {image ? "تغییر تصویر" : "افزودن تصویر"}
                </Button>
                {image ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive"
                    disabled={imageBusy}
                    onClick={() => void handleDeleteImage()}
                  >
                    <Trash2 className="size-4" />
                    حذف تصویر
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleImageSelect(event)}
              />
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
            onClick={() => void handleSave()}
            disabled={saving}
          >
            ذخیره تغییرات
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 border-border/80">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">استان و شهر</p>
              <p className="text-xs text-muted-foreground">
                محل سکونت شما برای نمایش در پروفایل
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="provinceId">استان</Label>
              <Select
                value={selectedProvinceId}
                onValueChange={handleProvinceChange}
                disabled={provincesLoading || locationBusy}
              >
                <SelectTrigger
                  id="provinceId"
                  className="h-11 w-full rounded-xl"
                >
                  <SelectValue placeholder="انتخاب استان" />
                </SelectTrigger>
                <SelectContent>
                  {provincesLoading ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      در حال بارگذاری…
                    </p>
                  ) : (
                    provinces.map((province) => (
                      <SelectItem
                        key={province.provinceId}
                        value={province.provinceId}
                      >
                        {province.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityId">شهر</Label>
              <Select
                value={selectedCityId}
                onValueChange={(value) => setSelectedCityId(value)}
                disabled={!selectedProvinceId || citiesLoading || locationBusy}
              >
                <SelectTrigger id="cityId" className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="ابتدا استان را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <p className="px-2 py-1.5 text-sm text-muted-foreground">
                      در حال بارگذاری…
                    </p>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.cityId} value={city.cityId}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {user.province && user.city ? (
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
              استان: {user.province.name} — شهر: {user.city.name}
            </p>
          ) : null}

          <Button
            type="button"
            className="h-11 w-full rounded-xl"
            onClick={() => void handleSaveLocation()}
            disabled={
              locationBusy ||
              !selectedProvinceId ||
              !selectedCityId ||
              citiesLoading
            }
          >
            {locationBusy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <MapPin className="size-4" />
            )}
            ذخیره استان و شهر
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated mb-4 border-border/80">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">نشستهای فعال</p>
              <p className="text-xs text-muted-foreground">
                مدیریت دستگاه‌هایی که وارد حساب شده‌اند
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => void handleLogoutAll()}
            >
              خروج از همه
            </Button>
          </div>

          {sessionsLoading ? (
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">نشستی یافت نشد.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => (
                <li
                  key={session.sessionId}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">
                      {session.deviceName || session.platform || "دستگاه ناشناس"}
                      {session.current ? (
                        <span className="mr-2 text-xs text-primary">(فعلی)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      آخرین فعالیت: {formatSessionTime(session.lastActivityAt)}
                    </p>
                  </div>
                  {!session.current && !session.revoked ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="shrink-0"
                      disabled={busySessionId === session.sessionId}
                      onClick={() => void handleRevoke(session.sessionId)}
                      aria-label="لغو نشست"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
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
        onClick={() => void handleLogout()}
      >
        <LogOut className="size-4" />
        خروج از حساب
      </Button>
    </PageContainer>
  );
}
