"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Search, Sprout, Tractor } from "lucide-react";

import { AppMenuTrigger } from "@/components/layout/app-menu-trigger";
import { PageContainer } from "@/components/layout/page-container";
import { LiveClock } from "@/components/shared/live-clock";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WeatherWidget } from "@/components/shared/weather-widget";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/auth-store";

function PanelLink({
  href,
  icon: Icon,
  label,
  description,
  variant,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  description: string;
  variant: "provider" | "consumer";
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleClick = (event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      toast.info("ابتدا وارد شوید");
      router.push("/auth");
    }
  };

  const isProvider = variant === "provider";

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={
        isProvider
          ? "group relative min-h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#34785a] to-success p-4 text-white shadow-[0_12px_30px_rgba(45,106,79,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(45,106,79,0.28)] active:scale-[0.98]"
          : "group relative min-h-36 overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-[#fffaf5] via-white to-[#fff1e5] p-4 text-foreground shadow-[0_10px_28px_rgba(139,115,85,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:shadow-[0_16px_34px_rgba(244,162,97,0.18)] active:scale-[0.98]"
      }
    >
      <div
        className={
          isProvider
            ? "pointer-events-none absolute -left-8 -top-8 size-28 rounded-full bg-white/10 blur-sm"
            : "pointer-events-none absolute -left-8 -top-8 size-28 rounded-full bg-accent/10 blur-sm"
        }
      />
      <div className="relative flex h-full flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-2">
          <div
            className={
              isProvider
                ? "flex size-12 items-center justify-center rounded-2xl bg-white/16 ring-1 ring-white/20 backdrop-blur-sm"
                : "flex size-12 items-center justify-center rounded-2xl bg-accent/12 text-accent ring-1 ring-accent/15"
            }
          >
            <Icon className="size-6" strokeWidth={1.8} />
          </div>
          <span
            className={
              isProvider
                ? "flex size-8 items-center justify-center rounded-full bg-white/12 transition-transform duration-300 group-hover:-translate-x-1"
                : "flex size-8 items-center justify-center rounded-full bg-accent/10 text-accent transition-transform duration-300 group-hover:-translate-x-1"
            }
          >
            <ChevronLeft className="size-4" />
          </span>
        </div>
        <div>
          <p className="text-sm font-bold leading-6">{label}</p>
          <p
            className={
              isProvider
                ? "mt-1 text-[11px] leading-5 text-white/78"
                : "mt-1 text-[11px] leading-5 text-muted-foreground"
            }
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <PageContainer className="pb-8">
      <header className="mb-5 flex items-center justify-between gap-3 animate-fade-in">
        <div className="flex min-w-0 items-center gap-3">
          {isAuthenticated && user ? (
            <UserAvatar name={user.displayName} />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sprout className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {isAuthenticated ? "خوش آمدید" : "به کشاورز خوش آمدید"}
            </p>
            <p className="truncate text-lg font-bold text-foreground">
              {isAuthenticated && user ? user.displayName : "مهمان"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isAuthenticated ? (
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/auth">ورود</Link>
            </Button>
          ) : null}
          <AppMenuTrigger />
        </div>
      </header>

      <section className="mb-5 flex items-center gap-3 px-1 animate-fade-in">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-success text-white shadow-md">
          <Sprout className="size-8" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground">کشاورز</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            پلتفرم هوشمند خدمات کشاورزی
          </p>
        </div>
      </section>

      <section className="mb-6 animate-slide-up">
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-base font-bold text-foreground">انتخاب پنل</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              برای شروع، نوع فعالیت خود را انتخاب کنید
            </p>
          </div>
          <span className="rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-medium text-primary">
            دسترسی سریع
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PanelLink
            href="/providers/home"
            icon={Tractor}
            label="خدمات‌دهنده"
            description="مدیریت خدمات، درخواست‌ها و درآمد"
            variant="provider"
          />
          <PanelLink
            href="/users/home"
            icon={Search}
            label="خدمات‌گیرنده"
            description="جستجو و پیگیری خدمات کشاورزی"
            variant="consumer"
          />
        </div>
      </section>

      <section className="hero-pattern gradient-hero relative -mx-4 mb-6 overflow-hidden rounded-3xl px-5 pb-6 pt-6 text-[#102f24] animate-slide-up">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.12),transparent_45%)]" />

        <div className="relative">
          <LiveClock variant="light" className="mb-4" />
          <WeatherWidget />
        </div>
      </section>

    </PageContainer>
  );
}
