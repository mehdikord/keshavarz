"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Sprout, Tractor, Wheat } from "lucide-react";

import { GuestGuard } from "@/components/shared/guest-guard";
import { OTPInput } from "@/components/shared/otp-input";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAppMe,
  requestAppOtp,
  resendAppOtp,
  verifyAppOtp,
} from "@/lib/api/app-auth";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { otpSchema, phoneSchema } from "@/lib/validators/auth";
import {
  formatPhoneDisplay,
  normalizePhone,
} from "@/lib/utils/phone";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

/** Matches OTP_POLICY.resendCooldownSeconds; overridden by Retry-After when present. */
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;

function AuthPageContent() {
  const router = useRouter();
  const setSessionFromMe = useAuthStore((state) => state.setSessionFromMe);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_RESEND_COOLDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  const applyCooldown = (retryAfterSeconds?: number) => {
    setSecondsLeft(
      retryAfterSeconds && retryAfterSeconds > 0
        ? retryAfterSeconds
        : DEFAULT_RESEND_COOLDOWN_SECONDS,
    );
  };

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    const result = phoneSchema.safeParse(normalized);

    if (!result.success) {
      setPhoneError(result.error.issues[0]?.message ?? "شماره موبایل معتبر نیست");
      return;
    }

    setPhoneError(null);
    setSubmitting(true);

    try {
      const response = await requestAppOtp({ phone: result.data });
      setPhone(result.data);
      setStep("otp");
      setOtp("");
      applyCooldown();
      toast.success("درخواست ارسال شد", response.data.message);
    } catch (cause: unknown) {
      if (isApiClientError(cause) && cause.status === 429) {
        setPhone(result.data);
        setStep("otp");
        setOtp("");
        applyCooldown(cause.retryAfterSeconds);
        toast.error(cause.message);
        return;
      }
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ارسال کد تأیید ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await resendAppOtp({ phone });
      applyCooldown();
      toast.success("کد جدید درخواست شد", response.data.message);
    } catch (cause: unknown) {
      if (isApiClientError(cause) && cause.status === 429) {
        applyCooldown(cause.retryAfterSeconds);
      }
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ارسال مجدد کد ناموفق بود.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async () => {
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "کد تأیید را کامل وارد کنید");
      return;
    }

    setSubmitting(true);
    try {
      await verifyAppOtp({ code: parsed.data, phone, platform: "web" });
      const me = await fetchAppMe();
      setSessionFromMe(me);
      toast.success("ورود موفق", "به کشاورز خوش آمدید");
      router.replace("/");
    } catch (cause: unknown) {
      toast.error(
        isApiClientError(cause)
          ? cause.message
          : "ورود ناموفق بود. دوباره تلاش کنید.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${toPersianDigits(minutes)}:${toPersianDigits(
      String(remaining).padStart(2, "0"),
    )}`;
  };

  return (
    <PageContainer className="flex flex-col">
      <section className="relative -mx-4 -mt-4 mb-6 overflow-hidden rounded-b-3xl bg-[linear-gradient(145deg,#1f513d_0%,#2d6a4f_55%,#34785a_100%)] px-6 pb-10 pt-12 text-white shadow-[0_18px_38px_rgba(45,106,79,0.25)] animate-slide-up motion-reduce:animate-none">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(255,255,255,0.2),transparent_55%)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-14 size-52 rounded-full bg-secondary/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-14 size-44 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden="true"
        />

        <Wheat
          className="pointer-events-none absolute right-7 top-9 size-9 text-white/20"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Sprout
          className="pointer-events-none absolute bottom-9 left-8 size-8 text-white/15"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <Tractor
          className="pointer-events-none absolute bottom-7 right-12 size-5 text-white/10"
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[13px] font-bold backdrop-blur-md animate-fade-in motion-reduce:animate-none">
            <Sparkles className="size-3.5" aria-hidden="true" />
            خوش آمدید
          </span>

          <div className="mt-5 flex items-center gap-3 animate-fade-in [animation-delay:100ms] motion-reduce:animate-none">
            <span className="h-px w-8 bg-white/30" aria-hidden="true" />
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/12 shadow-lg ring-1 ring-white/25 backdrop-blur-md">
              <Sprout className="size-7" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="h-px w-8 bg-white/30" aria-hidden="true" />
          </div>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight animate-fade-in [animation-delay:200ms] motion-reduce:animate-none">
            کشاورز
          </h1>

          <p className="mt-3 max-w-[17rem] text-[15px] font-semibold leading-8 text-white/90 animate-fade-in [animation-delay:300ms] motion-reduce:animate-none">
            همراه همیشگی کشاورزان در کاشت، داشت و برداشت
          </p>
        </div>
      </section>

      <Card className="card-elevated border-border/80 animate-fade-in">
        <CardHeader>
          <CardTitle>
            {step === "phone" ? "ورود با موبایل" : "تأیید کد"}
          </CardTitle>
          <CardDescription>
            {step === "phone"
              ? "شماره موبایل خود را وارد کنید"
              : `کد ارسال‌شده به ${formatPhoneDisplay(phone)} را وارد کنید`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {step === "phone" ? (
            <form onSubmit={(event) => void handlePhoneSubmit(event)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  className="h-12 rounded-xl text-left"
                  dir="ltr"
                  value={formatPhoneDisplay(phoneInput)}
                  disabled={submitting}
                  onChange={(event) => {
                    setPhoneInput(normalizePhone(event.target.value));
                    setPhoneError(null);
                  }}
                />
                {phoneError ? (
                  <p className="text-sm text-destructive">{phoneError}</p>
                ) : null}
              </div>
              <Button type="submit" className="h-12 w-full" disabled={submitting}>
                دریافت کد
              </Button>
            </form>
          ) : (
            <div className="space-y-5 animate-slide-up">
              <OTPInput
                value={otp}
                onChange={setOtp}
                length={6}
                disabled={submitting}
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {secondsLeft > 0
                    ? `ارسال مجدد تا ${formatTimer(secondsLeft)}`
                    : "می‌توانید دوباره کد دریافت کنید"}
                </span>
                <button
                  type="button"
                  className="font-medium text-primary disabled:opacity-50"
                  disabled={secondsLeft > 0 || submitting}
                  onClick={() => void handleResend()}
                >
                  ارسال مجدد
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1"
                  onClick={() => setStep("phone")}
                  disabled={submitting}
                >
                  بازگشت
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1"
                  onClick={() => void handleLogin()}
                  disabled={submitting}
                >
                  ورود
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default function AuthPage() {
  return (
    <GuestGuard>
      <AuthPageContent />
    </GuestGuard>
  );
}
