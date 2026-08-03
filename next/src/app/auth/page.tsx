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
import { MOCK_OTP } from "@/lib/mock/constants";
import { toast } from "@/lib/toast";
import { phoneSchema } from "@/lib/validators/auth";
import {
  formatPhoneDisplay,
  normalizePhone,
} from "@/lib/utils/phone";
import { toPersianDigits } from "@/lib/utils/format";
import { useAuthStore } from "@/stores/auth-store";

const OTP_DURATION_SECONDS = 120;

function AuthPageContent() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_DURATION_SECONDS);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step, secondsLeft]);

  const handlePhoneSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    const result = phoneSchema.safeParse(normalized);

    if (!result.success) {
      setPhoneError(result.error.issues[0]?.message ?? "شماره موبایل معتبر نیست");
      return;
    }

    setPhoneError(null);
    setPhone(result.data);
    setStep("otp");
    setOtp("");
    setSecondsLeft(OTP_DURATION_SECONDS);
  };

  const handleLogin = () => {
    if (otp.length !== 5) {
      toast.error("کد تأیید را کامل وارد کنید");
      return;
    }

    setSubmitting(true);
    const success = login(phone, otp);
    setSubmitting(false);

    if (!success) {
      toast.error("کد تأیید نامعتبر است");
      return;
    }

    toast.success("ورود موفق", "به کشاورز خوش آمدید");
    router.replace("/");
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
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">شماره موبایل</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                  className="h-12 rounded-xl text-left"
                  dir="ltr"
                  value={formatPhoneDisplay(phoneInput)}
                  onChange={(event) => {
                    setPhoneInput(normalizePhone(event.target.value));
                    setPhoneError(null);
                  }}
                />
                {phoneError ? (
                  <p className="text-sm text-destructive">{phoneError}</p>
                ) : null}
              </div>
              <Button type="submit" className="h-12 w-full">
                دریافت کد
              </Button>
            </form>
          ) : (
            <div className="space-y-5 animate-slide-up">
              <OTPInput value={otp} onChange={setOtp} disabled={submitting} />

              <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-3 py-2 text-center text-xs text-muted-foreground">
                کد Mock:{" "}
                <span className="font-semibold text-primary" dir="ltr">
                  {MOCK_OTP}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {secondsLeft > 0
                    ? `ارسال مجدد تا ${formatTimer(secondsLeft)}`
                    : "می‌توانید دوباره کد دریافت کنید"}
                </span>
                <button
                  type="button"
                  className="font-medium text-primary disabled:opacity-50"
                  disabled={secondsLeft > 0}
                  onClick={() => setSecondsLeft(OTP_DURATION_SECONDS)}
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
                  onClick={handleLogin}
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
