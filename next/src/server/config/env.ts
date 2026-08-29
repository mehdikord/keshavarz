import * as z from "zod";

const MySqlUrlSchema = z
  .string()
  .url("آدرس اتصال دیتابیس معتبر نیست.")
  .refine((value) => value.startsWith("mysql://"), {
    message: "آدرس دیتابیس باید از پروتکل mysql استفاده کند.",
  });

const DatabaseEnvironmentSchema = z.object({
  DATABASE_URL: MySqlUrlSchema,
  DIRECT_DATABASE_URL: MySqlUrlSchema,
});

const SecurityEnvironmentSchema = z.object({
  APP_ENV: z.enum(["local", "development", "test", "staging", "production"], {
    message: "APP_ENV باید یکی از مقادیر local, development, test, staging, production باشد.",
  }),
  APP_ORIGIN: z.string().url("Origin اپ معتبر نیست."),
  ADMIN_ORIGIN: z.string().url("Origin مدیریت معتبر نیست."),
  OBJECT_STORAGE_GATEWAY_TOKEN: z.string().min(1).optional(),
  OBJECT_STORAGE_GATEWAY_URL: z.string().url().optional(),
  SMS_QUEUE_TOKEN: z.string().min(1).optional(),
  SMS_QUEUE_URL: z.string().url().optional(),
  TOKEN_HASH_SECRET: z.string().min(32, "secret توکن حداقل ۳۲ کاراکتر است."),
  OTP_HASH_PEPPER: z.string().min(32, "pepper کد OTP حداقل ۳۲ کاراکتر است."),
  TOKEN_HASH_SECRET_PREVIOUS: z
    .string()
    .min(32, "secret قبلی توکن حداقل ۳۲ کاراکتر است.")
    .optional(),
  OTP_HASH_PEPPER_PREVIOUS: z
    .string()
    .min(32, "pepper قبلی کد OTP حداقل ۳۲ کاراکتر است.")
    .optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

const databaseEnvironmentResult = DatabaseEnvironmentSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
});

if (!databaseEnvironmentResult.success) {
  throw new Error("متغیرهای محیطی اتصال دیتابیس کامل یا معتبر نیستند.");
}

export const databaseEnvironment = databaseEnvironmentResult.data;

export function getSecurityEnvironment(): z.infer<
  typeof SecurityEnvironmentSchema
> {
  const result = SecurityEnvironmentSchema.safeParse({
    APP_ENV: process.env.APP_ENV,
    APP_ORIGIN: process.env.APP_ORIGIN,
    ADMIN_ORIGIN: process.env.ADMIN_ORIGIN,
    OBJECT_STORAGE_GATEWAY_TOKEN:
      process.env.OBJECT_STORAGE_GATEWAY_TOKEN,
    OBJECT_STORAGE_GATEWAY_URL:
      process.env.OBJECT_STORAGE_GATEWAY_URL,
    SMS_QUEUE_TOKEN: process.env.SMS_QUEUE_TOKEN,
    SMS_QUEUE_URL: process.env.SMS_QUEUE_URL,
    TOKEN_HASH_SECRET: process.env.TOKEN_HASH_SECRET,
    OTP_HASH_PEPPER: process.env.OTP_HASH_PEPPER,
    TOKEN_HASH_SECRET_PREVIOUS: process.env.TOKEN_HASH_SECRET_PREVIOUS,
    OTP_HASH_PEPPER_PREVIOUS: process.env.OTP_HASH_PEPPER_PREVIOUS,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  if (!result.success) {
    throw new Error("متغیرهای محیطی امنیت API کامل یا معتبر نیستند.");
  }

  const hasRedisUrl = Boolean(result.data.UPSTASH_REDIS_REST_URL);
  const hasRedisToken = Boolean(result.data.UPSTASH_REDIS_REST_TOKEN);

  if (hasRedisUrl !== hasRedisToken) {
    throw new Error("تنظیمات Upstash Redis باید به‌صورت کامل وارد شوند.");
  }

  const hasSmsQueueUrl = Boolean(result.data.SMS_QUEUE_URL);
  const hasSmsQueueToken = Boolean(result.data.SMS_QUEUE_TOKEN);

  if (hasSmsQueueUrl !== hasSmsQueueToken) {
    throw new Error("تنظیمات صف پیامک باید به‌صورت کامل وارد شوند.");
  }

  const hasStorageUrl = Boolean(result.data.OBJECT_STORAGE_GATEWAY_URL);
  const hasStorageToken = Boolean(
    result.data.OBJECT_STORAGE_GATEWAY_TOKEN,
  );

  if (hasStorageUrl !== hasStorageToken) {
    throw new Error("تنظیمات درگاه object storage باید کامل وارد شوند.");
  }

  return result.data;
}
