import * as z from "zod";

import { IranianMobileSchema } from "@/server/modules/app-auth/app-auth.schemas";

export const AdminLoginSchema = z
  .object({
    password: z.string().min(1, "رمز عبور را وارد کنید.").max(256),
    phone: IranianMobileSchema,
  })
  .strict();

export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
