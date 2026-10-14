import * as z from "zod";

import { ADMIN_PASSWORD_POLICY } from "@/server/contracts";
import { IranianMobileSchema } from "@/server/modules/app-auth/app-auth.schemas";

export const AdminLoginSchema = z
  .object({
    password: z
      .string()
      .min(1, "رمز عبور الزامی است.")
      .max(ADMIN_PASSWORD_POLICY.maxLength),
    phone: IranianMobileSchema,
  })
  .strict();

export const AdminProfileUpdateSchema = z
  .object({
    email: z.string().email("ایمیل معتبر نیست.").max(191).nullable().optional(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(ADMIN_PASSWORD_POLICY.maxLength),
    newPassword: z
      .string()
      .min(
        ADMIN_PASSWORD_POLICY.minLength,
        `رمز عبور باید حداقل ${ADMIN_PASSWORD_POLICY.minLength} کاراکتر باشد.`,
      )
      .max(ADMIN_PASSWORD_POLICY.maxLength),
  })
  .strict();
