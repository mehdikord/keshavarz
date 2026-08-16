"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout } from "lucide-react";

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
      <section className="gradient-hero hero-pattern -mx-4 -mt-4 mb-6 flex flex-col items-center rounded-b-3xl px-6 pb-8 pt-10 text-[#102f24] animate-slide-up">
        <div className="mb-3 flex size-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <Sprout className="size-9" strokeWidth={1.75} />
        </div>
        <h1 className="text-2xl font-bold">کشاورز</h1>
        <p className="mt-2 text-center text-sm font-medium text-[#183f31]">
          ورود به پلتفرم خدمات کشاورزی
        </p>
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
