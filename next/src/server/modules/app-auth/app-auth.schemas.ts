import * as z from "zod";

const DIGIT_MAP: Record<string, string> = {
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function normalizeIranianMobile(value: string): string {
  const ascii = [...value]
    .map((character) => DIGIT_MAP[character] ?? character)
    .join("")
    .replace(/[\s()-]/g, "");

  if (ascii.startsWith("+98")) return `0${ascii.slice(3)}`;
  if (ascii.startsWith("0098")) return `0${ascii.slice(4)}`;
  if (ascii.startsWith("98") && ascii.length === 12) {
    return `0${ascii.slice(2)}`;
  }

  return ascii;
}

export const IranianMobileSchema = z
  .string()
  .transform(normalizeIranianMobile)
  .pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل ایرانی معتبر نیست."));

export const OtpRequestSchema = z.object({
  phone: IranianMobileSchema,
}).strict();

export const OtpVerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد."),
  deviceId: z.string().min(1).max(191).optional(),
  deviceName: z.string().min(1).max(120).optional(),
  phone: IranianMobileSchema,
  platform: z.enum(["web", "pwa", "android", "ios", "unknown"]).default("pwa"),
}).strict();

export const ProfileUpdateSchema = z.object({
  locale: z.string().min(2).max(10).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().min(1).max(64).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: "حداقل یک فیلد قابل ویرایش لازم است.",
});

export const SessionParamsSchema = z.object({
  sessionId: z.string().regex(
    /^[0-9A-HJKMNP-TV-Z]{26}$/,
    "شناسه نشست معتبر نیست.",
  ),
}).strict();
