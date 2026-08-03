import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل معتبر نیست");

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "کد تأیید باید ۵ رقم باشد");

export const authFormSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export type AuthFormValues = z.infer<typeof authFormSchema>;
