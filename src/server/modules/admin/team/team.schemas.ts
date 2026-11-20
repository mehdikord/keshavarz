import * as z from "zod";

import { ADMIN_PASSWORD_POLICY } from "@/server/contracts";
import { IranianMobileSchema } from "@/server/modules/app-auth/app-auth.schemas";

const PERSIAN_DIGITS = /[۰-۹٠-٩]/g;

function toLatinDigits(value: string): string {
  return value.replace(PERSIAN_DIGITS, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

export const PublicIdSchema = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "شناسه معتبر نیست.");
const RowIdSchema = z.string().regex(/^[1-9]\d{0,18}$/, "شناسه معتبر نیست.");

/** Same rules for every admin password set from the panel. */
export const AdminPasswordSchema = z
  .string()
  .min(ADMIN_PASSWORD_POLICY.minLength, `رمز عبور باید دست‌کم ${ADMIN_PASSWORD_POLICY.minLength} نویسه باشد.`)
  .max(ADMIN_PASSWORD_POLICY.maxLength, "رمز عبور طولانی‌تر از حد مجاز است.")
  .refine((value) => /[A-Za-z؀-ۿ]/.test(value) && /[0-9۰-۹]/.test(value), {
    message: "رمز عبور باید هم حرف و هم عدد داشته باشد.",
  })
  .refine((value) => !/^(.)\1+$/.test(value), { message: "رمز عبور نباید از یک نویسه تکراری ساخته شود." });

const OptionalExpirySchema = z.iso
  .datetime({ offset: true })
  .nullable()
  .optional()
  .transform((value) => (value ? new Date(value) : null))
  .refine((value) => value === null || value.getTime() > Date.now(), { message: "تاریخ انقضا باید در آینده باشد." });

// ------------------------------------------------------------------ admins

export const ADMIN_STATUSES = ["all", "active", "inactive", "locked"] as const;

export const AdminsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => [10, 20, 50, 100].includes(value))
    .catch(20),
  q: z
    .string()
    .trim()
    .max(100)
    .transform((value) => toLatinDigits(value))
    .optional()
    .catch(undefined),
  role: RowIdSchema.optional().catch(undefined),
  status: z.enum(ADMIN_STATUSES).catch("all"),
});
export type AdminsListQuery = z.infer<typeof AdminsListQuerySchema>;

export const AdminParamsSchema = z.object({ adminId: PublicIdSchema });

const NameSchema = z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد.").max(120, "نام طولانی‌تر از حد مجاز است.");
const EmailSchema = z
  .union([z.literal(""), z.email("ایمیل معتبر نیست.").max(191)])
  .nullable()
  .optional()
  .transform((value) => (value ? value.toLowerCase() : null));

export const AdminCreateSchema = z
  .object({
    email: EmailSchema,
    isSuperAdmin: z.boolean().default(false),
    name: NameSchema,
    /** Empty: the server generates one and returns it once. */
    password: z.union([z.literal(""), AdminPasswordSchema]).optional(),
    phone: IranianMobileSchema,
    roleIds: z.array(RowIdSchema).max(50).default([]),
  })
  .strict();
export type AdminCreateInput = z.infer<typeof AdminCreateSchema>;

export const AdminUpdateSchema = z
  .object({
    email: EmailSchema,
    isSuperAdmin: z.boolean().optional(),
    name: NameSchema,
    phone: IranianMobileSchema,
  })
  .strict();
export type AdminUpdateInput = z.infer<typeof AdminUpdateSchema>;

export const AdminStatusSchema = z
  .object({
    isActive: z.boolean(),
    reason: z.string().trim().min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.").max(500),
  })
  .strict();

export const AdminPasswordResetSchema = z
  .object({ password: z.union([z.literal(""), AdminPasswordSchema]).optional() })
  .strict();

export const AdminRolesSchema = z
  .object({
    roles: z
      .array(z.object({ expiresAt: OptionalExpirySchema, roleId: RowIdSchema }).strict())
      .max(50)
      .refine((value) => new Set(value.map((row) => row.roleId)).size === value.length, {
        message: "یک نقش دو بار انتخاب شده است.",
      }),
  })
  .strict();
export type AdminRolesInput = z.infer<typeof AdminRolesSchema>;

export const AdminOverrideSchema = z
  .object({
    effect: z.enum(["allow", "deny"]),
    expiresAt: OptionalExpirySchema,
    permission: z.string().min(3).max(170),
    reason: z.string().trim().min(5, "دلیل را دست‌کم در ۵ حرف بنویسید.").max(500),
  })
  .strict();
export type AdminOverrideInput = z.infer<typeof AdminOverrideSchema>;

export const AdminOverrideParamsSchema = AdminParamsSchema.extend({ overrideId: RowIdSchema });

export const AdminSessionRevokeSchema = z
  .object({ sessionId: PublicIdSchema.optional() })
  .strict();

// ------------------------------------------------------------------- roles

export const RoleParamsSchema = z.object({ roleId: RowIdSchema });

export const RolesListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  view: z.enum(["all", "assigned", "unassigned", "inactive"]).catch("all"),
});
export type RolesListQuery = z.infer<typeof RolesListQuerySchema>;

const RoleCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .regex(/^[a-z][a-z0-9_]*$/, "کد نقش فقط حروف کوچک انگلیسی، عدد و زیرخط (_) می‌پذیرد و باید با حرف شروع شود.");

export const RoleCreateSchema = z
  .object({
    code: z
      .union([z.literal(""), RoleCodeSchema])
      .optional()
      .transform((value) => (value ? value : undefined)),
    description: z.string().trim().max(500).nullable().optional().transform((value) => (value ? value : null)),
    isActive: z.boolean().default(true),
    name: z.string().trim().min(2, "نام نقش باید حداقل ۲ حرف باشد.").max(120),
    permissions: z.array(z.string().min(3).max(170)).max(200).default([]),
  })
  .strict();
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;

export const RoleUpdateSchema = z
  .object({
    description: z.string().trim().max(500).nullable().optional().transform((value) => (value ? value : null)),
    isActive: z.boolean(),
    name: z.string().trim().min(2, "نام نقش باید حداقل ۲ حرف باشد.").max(120),
    permissions: z.array(z.string().min(3).max(170)).max(200),
  })
  .strict();
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;

export const RoleDeleteSchema = z
  .object({ unassign: z.boolean().default(false) })
  .strict();

// ------------------------------------------------------------------- audit

export const AUDIT_PERIODS = ["all", "today", "7d", "30d", "90d"] as const;

export const AuditListQuerySchema = z.object({
  action: z.string().trim().max(120).optional().catch(undefined),
  actor: z.union([PublicIdSchema, z.literal("system")]).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  ip: z.string().trim().max(45).optional().catch(undefined),
  module: z.string().trim().max(80).regex(/^[a-z_]+$/).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
  period: z.enum(AUDIT_PERIODS).catch("all"),
  perPage: z.coerce
    .number()
    .int()
    .refine((value) => [10, 20, 50, 100].includes(value))
    .catch(20),
  subjectId: z.string().trim().max(40).optional().catch(undefined),
  subjectType: z.string().trim().max(120).regex(/^[A-Za-z_]+$/).optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
});
export type AuditListQuery = z.infer<typeof AuditListQuerySchema>;

export const AuditParamsSchema = z.object({ auditId: RowIdSchema });

// ----------------------------------------------------------------- account

export const AccountProfileSchema = z
  .object({
    email: EmailSchema,
    name: NameSchema,
  })
  .strict();

export const AccountPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز عبور فعلی را وارد کنید.").max(256),
    newPassword: AdminPasswordSchema,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "رمز عبور جدید باید با رمز فعلی فرق داشته باشد.",
    path: ["newPassword"],
  });

export const AccountSessionRevokeSchema = z
  .object({ others: z.boolean().optional(), sessionId: PublicIdSchema.optional() })
  .strict()
  .refine((value) => Boolean(value.others) !== Boolean(value.sessionId), {
    message: "یک نشست یا «همه نشست‌های دیگر» را انتخاب کنید.",
  });
