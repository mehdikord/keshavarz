"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, useAnimationControls } from "framer-motion";
import { ArrowLeft, Check, LoaderCircle, Pencil, RotateCw, ShieldCheck, Smartphone, Sprout } from "lucide-react";

import { FarmScene, type FarmStage } from "@/components/auth/farm-scene";
import { GuestGuard } from "@/components/shared/guest-guard";
import { OTPInput } from "@/components/shared/otp-input";
import { fetchAppMe, requestAppOtp, resendAppOtp, verifyAppOtp } from "@/lib/api/app-auth";
import { isApiClientError } from "@/lib/api/envelope";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { toLatinDigits, toPersianDigits } from "@/lib/utils/format";
import { formatPhoneDisplay, normalizePhone } from "@/lib/utils/phone";
import { otpSchema, phoneSchema } from "@/lib/validators/auth";
import { useAuthStore } from "@/stores/auth-store";

/** Matches OTP_POLICY.resendCooldownSeconds; overridden by Retry-After when present. */
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;
/** Lets the harvest animation play before the guest guard redirects away. */
const SUCCESS_HOLD_MS = 1600;

const STAGE_COPY: Record<FarmStage, { title: string; subtitle: string }> = {
  phone: { title: "به کشاورز خوش آمدید", subtitle: "همراه کشاورزان، از کاشت تا برداشت" },
  otp: { title: "کد تأیید را وارد کنید", subtitle: "کد ۶ رقمی برایتان پیامک شد" },
  success: { title: "خوش آمدید!", subtitle: "در حال ورود به حساب شما…" },
};

function AuthPageContent() {
  const router = useRouter();
  const setSessionFromMe = useAuthStore((state) => state.setSessionFromMe);
  const shake = useAnimationControls();
  const phoneRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<FarmStage>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_RESEND_COOLDOWN_SECONDS);
  const [submitting, setSubmitting] = useState(false);
  // Remounting the OTP boxes after a failed attempt puts focus back on the first box.
  const [otpAttempt, setOtpAttempt] = useState(0);

  useEffect(() => {
    if (stage !== "otp" || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [stage, secondsLeft]);

  const applyCooldown = (retryAfterSeconds?: number) => {
    setSecondsLeft(retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : DEFAULT_RESEND_COOLDOWN_SECONDS);
  };

  const shakeCard = () => {
    void shake.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.45 } });
  };

  const goToOtp = (normalized: string, retryAfterSeconds?: number) => {
    setPhone(normalized);
    setOtp("");
    setOtpError(null);
    setStage("otp");
    applyCooldown(retryAfterSeconds);
  };

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    const result = phoneSchema.safeParse(normalized);

    if (!result.success) {
      setPhoneError(result.error.issues[0]?.message ?? "شماره موبایل معتبر نیست");
      shakeCard();
      return;
    }

    setPhoneError(null);
    setSubmitting(true);
    try {
      const response = await requestAppOtp({ phone: result.data });
      goToOtp(result.data);
      toast.success("کد تأیید ارسال شد", response.data.message);
    } catch (cause: unknown) {
      if (isApiClientError(cause) && cause.status === 429) {
        goToOtp(result.data, cause.retryAfterSeconds);
        toast.error(cause.message);
        return;
      }
      toast.error(isApiClientError(cause) ? cause.message : "ارسال کد تأیید ناموفق بود.");
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
      setOtp("");
      setOtpError(null);
      toast.success("کد جدید ارسال شد", response.data.message);
    } catch (cause: unknown) {
      if (isApiClientError(cause) && cause.status === 429) applyCooldown(cause.retryAfterSeconds);
      toast.error(isApiClientError(cause) ? cause.message : "ارسال مجدد کد ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (code: string) => {
    const parsed = otpSchema.safeParse(code);
    if (!parsed.success) {
      setOtpError(parsed.error.issues[0]?.message ?? "کد تأیید را کامل وارد کنید");
      shakeCard();
      return;
    }

    setSubmitting(true);
    setOtpError(null);
    try {
      await verifyAppOtp({ code: parsed.data, phone, platform: "web" });
      const me = await fetchAppMe();
      setStage("success");
      window.setTimeout(() => {
        setSessionFromMe(me);
        router.replace("/");
      }, SUCCESS_HOLD_MS);
    } catch (cause: unknown) {
      setOtpError(isApiClientError(cause) ? cause.message : "ورود ناموفق بود. دوباره تلاش کنید.");
      setOtp("");
      setOtpAttempt((value) => value + 1);
      shakeCard();
      setSubmitting(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (otpError) setOtpError(null);
    // Submit as soon as the last digit lands; SMS autofill also takes this path.
    if (value.length === OTP_LENGTH && !submitting) void handleLogin(value);
  };

  const editPhone = () => {
    setStage("phone");
    setOtp("");
    setOtpError(null);
    window.setTimeout(() => phoneRef.current?.focus(), 350);
  };

  const phoneDigits = normalizePhone(phoneInput);
  const phoneReady = phoneSchema.safeParse(phoneDigits).success;
  const copy = STAGE_COPY[stage];
  const progress = 1 - secondsLeft / DEFAULT_RESEND_COOLDOWN_SECONDS;

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-[#f8faf5]">
        <section className="relative h-[40dvh] min-h-[260px] shrink-0">
          <FarmScene stage={stage} />

          <div className="relative flex h-full flex-col items-center px-6 pt-[calc(env(safe-area-inset-top,0px)+1.75rem)] text-center">
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
              className={cn(
                "flex size-16 items-center justify-center rounded-[22px] shadow-[0_16px_32px_-12px_rgba(27,67,50,0.6)] transition-colors duration-700",
                stage === "success"
                  ? "bg-gradient-to-br from-[#ffe08a] to-[#c98a2b] text-[#3a2208]"
                  : "bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-[#d8f3dc]",
              )}
            >
              {stage === "success" ? <Check className="size-8" strokeWidth={3} /> : <Sprout className="size-8" strokeWidth={1.75} />}
            </motion.span>

            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="mt-4 text-[25px] font-black leading-tight text-[#14301f]">{copy.title}</h1>
                <p className="mt-1.5 text-[13px] font-medium text-[#3d5a45]">{copy.subtitle}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        <motion.section
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 -mt-8 flex flex-1 flex-col rounded-t-[34px] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-[0_-18px_40px_-24px_rgba(27,67,50,0.4)]"
        >
          <div className="mb-5 flex items-center justify-center gap-1.5" aria-hidden>
            {(["phone", "otp", "success"] as const).map((key, index) => {
              const reached = ["phone", "otp", "success"].indexOf(stage) >= index;
              return (
                <motion.span
                  key={key}
                  className={cn("h-1.5 rounded-full", reached ? "bg-[#2d6a4f]" : "bg-[#e3ebe3]")}
                  animate={{ width: stage === key ? 28 : 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              );
            })}
          </div>

          <motion.div animate={shake} className="flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {stage === "phone" ? (
                <motion.form
                  key="phone"
                  onSubmit={(event) => void handlePhoneSubmit(event)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-full flex-col"
                >
                  <label htmlFor="phone" className="text-[15px] font-black text-[#1a2e1a]">
                    شماره موبایل
                  </label>
                  <p className="mt-1 text-[12px] text-[#5c6b5c]">برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید.</p>

                  <div
                    className={cn(
                      "mt-4 flex h-16 items-center gap-3 rounded-[20px] bg-[#f4f8f3] px-4 ring-2 transition-all focus-within:bg-white",
                      phoneError
                        ? "ring-[#e8a08f]"
                        : phoneReady
                          ? "ring-[#52b788]"
                          : "ring-transparent focus-within:ring-[#95d5b2]",
                    )}
                  >
                    <Smartphone className="size-5 shrink-0 text-[#2d6a4f]" />
                    <input
                      ref={phoneRef}
                      id="phone"
                      inputMode="tel"
                      autoComplete="tel-national"
                      autoFocus
                      placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                      dir="ltr"
                      value={toPersianDigits(formatPhoneDisplay(phoneInput))}
                      disabled={submitting}
                      onChange={(event) => {
                        setPhoneInput(normalizePhone(toLatinDigits(event.target.value)));
                        setPhoneError(null);
                      }}
                      className="h-full min-w-0 flex-1 bg-transparent text-left text-[20px] font-black tracking-wide text-[#1a2e1a] outline-none placeholder:font-bold placeholder:text-[#b5c2b5]"
                    />
                    <AnimatePresence>
                      {phoneReady ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#52b788] text-white"
                        >
                          <Check className="size-4" strokeWidth={3} />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <AnimatePresence>
                    {phoneError ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 text-[12px] font-bold text-[#b23a1f]"
                      >
                        {phoneError}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      "group mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-[20px] text-[15px] font-black text-white transition-all active:scale-[0.98] disabled:opacity-80",
                      phoneReady
                        ? "bg-[linear-gradient(135deg,#2d6a4f_0%,#1b4332_100%)] shadow-[0_16px_32px_-14px_rgba(27,67,50,0.9)]"
                        : "bg-[#7f9a87]",
                    )}
                  >
                    {submitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
                    {submitting ? "در حال ارسال کد…" : "دریافت کد تأیید"}
                    {!submitting ? <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-1" /> : null}
                  </button>

                  <p className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-[11px] leading-5 text-[#7a8a7a]">
                    <ShieldCheck className="size-4 shrink-0 text-[#52b788]" />
                    شماره شما فقط برای ورود و هماهنگی کارها استفاده می‌شود.
                  </p>
                </motion.form>
              ) : stage === "otp" ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[#f4f8f3] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#5c6b5c]">کد ارسال شد به</p>
                      <p dir="ltr" className="text-right text-[16px] font-black tracking-wide text-[#1a2e1a]">
                        {toPersianDigits(formatPhoneDisplay(phone))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={editPhone}
                      disabled={submitting}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-black text-[#2d6a4f] ring-1 ring-[#d4e6d9]"
                    >
                      <Pencil className="size-3.5" />
                      ویرایش
                    </button>
                  </div>

                  <div className="relative mt-6">
                    <OTPInput
                      key={otpAttempt}
                      value={otp}
                      onChange={handleOtpChange}
                      length={OTP_LENGTH}
                      disabled={submitting}
                      invalid={Boolean(otpError)}
                      autoFocus
                      className="gap-2 [&_input]:h-14 [&_input]:w-12 [&_input]:rounded-2xl [&_input]:text-[22px] [&_input]:font-black"
                    />
                    {submitting ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-[1px]">
                        <LoaderCircle className="size-7 animate-spin text-[#2d6a4f]" />
                      </div>
                    ) : null}
                  </div>
                  <AnimatePresence>
                    {otpError ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 text-center text-[12px] font-bold text-[#b23a1f]"
                      >
                        {otpError}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  <div className="mt-6 flex items-center justify-center">
                    {secondsLeft > 0 ? (
                      <div className="flex items-center gap-2.5 text-[12.5px] font-bold text-[#5c6b5c]">
                        <span className="relative size-8">
                          <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#e3ebe3" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#52b788"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 15}
                              strokeDashoffset={2 * Math.PI * 15 * (1 - progress)}
                              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black tabular-nums text-[#2d6a4f]">
                            {toPersianDigits(secondsLeft)}
                          </span>
                        </span>
                        ارسال دوباره کد تا چند لحظه دیگر
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleResend()}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5ef] px-4 py-2 text-[12.5px] font-black text-[#2d6a4f] transition-colors hover:bg-[#e1efe4] disabled:opacity-60"
                      >
                        <RotateCw className="size-4" />
                        ارسال دوباره کد
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleLogin(otp)}
                    disabled={submitting || otp.length < OTP_LENGTH}
                    className="mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-[20px] bg-[linear-gradient(135deg,#2d6a4f_0%,#1b4332_100%)] text-[15px] font-black text-white shadow-[0_16px_32px_-14px_rgba(27,67,50,0.9)] transition-all active:scale-[0.98] disabled:bg-none disabled:bg-[#b5c2b5] disabled:shadow-none"
                  >
                    {submitting ? <LoaderCircle className="size-5 animate-spin" /> : null}
                    ورود به کشاورز
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col items-center justify-center py-6 text-center"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 14 }}
                    className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#52b788] to-[#2d6a4f] text-white shadow-[0_18px_36px_-12px_rgba(45,106,79,0.8)]"
                  >
                    <Check className="size-10" strokeWidth={3} />
                  </motion.span>
                  <p className="mt-4 text-[16px] font-black text-[#1a2e1a]">ورود با موفقیت انجام شد</p>
                  <p className="mt-1 text-[12px] text-[#5c6b5c]">مزرعه شما آماده است</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      </main>
    </MotionConfig>
  );
}

export default function AuthPage() {
  return (
    <GuestGuard>
      <AuthPageContent />
    </GuestGuard>
  );
}
