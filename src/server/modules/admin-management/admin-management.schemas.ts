import * as z from "zod";

import { ADMIN_PASSWORD_POLICY, PublicIdSchema } from "@/server/contracts";
import { createCursorPaginationSchema } from "@/server/http";
import { IranianMobileSchema } from "@/server/modules/app-auth/app-auth.schemas";

const OptionalBooleanQuerySchema = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    return value === "true" || value === "1";
  });

export const RoleCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z][a-z0-9_]{1,99}$/,
    "کد نقش باید با حرف کوچک شروع شود و فقط شامل حرف، عدد و _ باشد.",
  );

export const PermissionCodeSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
    "کد دسترسی معتبر نیست.",
  );

export const AdminParamsSchema = z
  .object({
    adminId: PublicIdSchema,
  })
  .strict();

export const RoleParamsSchema = z
  .object({
    roleId: RoleCodeSchema,
  })
  .strict();

export const AdminsQuerySchema = createCursorPaginationSchema([
  "createdAt",
] as const).extend({
  isActive: OptionalBooleanQuerySchema,
  q: z.string().trim().min(1).max(120).optional(),
});

export const AdminCreateSchema = z
  .object({
    email: z.string().email("ایمیل معتبر نیست.").max(191).nullable().optional(),
    isSuperAdmin: z.boolean().default(false),
    name: z.string().trim().min(2).max(120),
    password: z
      .string()
      .min(
        ADMIN_PASSWORD_POLICY.minLength,
        `رمز عبور باید حداقل ${ADMIN_PASSWORD_POLICY.minLength} کاراکتر باشد.`,
      )
      .max(ADMIN_PASSWORD_POLICY.maxLength),
    phone: IranianMobileSchema,
  })
  .strict();

export const AdminUpdateSchema = z
  .object({
    email: z.string().email("ایمیل معتبر نیست.").max(191).nullable().optional(),
    image: z.string().trim().min(1).max(512).nullable().optional(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const AdminStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export const AdminResetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        ADMIN_PASSWORD_POLICY.minLength,
        `رمز عبور باید حداقل ${ADMIN_PASSWORD_POLICY.minLength} کاراکتر باشد.`,
      )
      .max(ADMIN_PASSWORD_POLICY.maxLength),
  })
  .strict();

export const AdminRolesReplaceSchema = z
  .object({
    roleIds: z.array(RoleCodeSchema).max(50),
  })
  .strict();

export const AdminPermissionOverridesReplaceSchema = z
  .object({
    overrides: z
      .array(
        z
          .object({
            effect: z.enum(["allow", "deny"]),
            expiresAt: z.string().datetime({ offset: false }).nullable().optional(),
            permissionCode: PermissionCodeSchema,
            reason: z.string().trim().min(1).max(500).nullable().optional(),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();

export const RoleCreateSchema = z
  .object({
    code: RoleCodeSchema,
    description: z.string().trim().min(1).max(500).nullable().optional(),
    name: z.string().trim().min(2).max(120),
  })
  .strict();

export const RoleUpdateSchema = z
  .object({
    code: RoleCodeSchema.optional(),
    description: z.string().trim().min(1).max(500).nullable().optional(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(2).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد قابل ویرایش لازم است.",
  });

export const RolePermissionsReplaceSchema = z
  .object({
    permissionCodes: z.array(PermissionCodeSchema).max(500),
  })
  .strict();
