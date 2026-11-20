/**
 * Admin-editable settings. Each entry is read through `getSetting()` with its
 * `default` as fallback, so behaviour is unchanged until an admin saves a value.
 * Pure data: safe to import from client components (labels, limits, defaults).
 */

export const SETTING_SECTIONS = [
  { description: "راه‌های ارتباط کاربران با پشتیبانی که در منوی اپلیکیشن نمایش داده می‌شود.", id: "support", title: "پشتیبانی و تماس" },
  { description: "محدودیت‌های جستجوی خدمات‌دهنده و ثبت درخواست توسط خدمات‌گیرنده.", id: "search", title: "جستجو و درخواست" },
  { description: "قواعد پروفایل خدمات‌دهندگان.", id: "providers", title: "خدمات‌دهندگان" },
  { description: "خرید اشتراک توسط خدمات‌دهندگان.", id: "subscriptions", title: "اشتراک" },
] as const;

export type SettingSectionId = (typeof SETTING_SECTIONS)[number]["id"];

interface BaseDefinition {
  group: string;
  help: string;
  /** Exposed by `GET /api/app/v1/public/settings`. */
  isPublic: boolean;
  key: string;
  label: string;
  section: SettingSectionId;
}

export interface StringSettingDefinition extends BaseDefinition {
  default: string;
  maxLength: number;
  /** Regex source; empty string always passes (means "not set"). */
  pattern?: string;
  patternMessage?: string;
  placeholder?: string;
  type: "string";
  /** Rendered left-to-right (phone numbers, codes). */
  ltr?: boolean;
}

export interface IntegerSettingDefinition extends BaseDefinition {
  default: number;
  max: number;
  min: number;
  type: "integer";
  unit?: string;
}

export interface BooleanSettingDefinition extends BaseDefinition {
  default: boolean;
  offLabel: string;
  onLabel: string;
  type: "boolean";
}

export type SettingDefinition = StringSettingDefinition | IntegerSettingDefinition | BooleanSettingDefinition;
export type SettingValue = string | number | boolean;

export const SETTINGS_REGISTRY = [
  {
    default: "",
    group: "app",
    help: "در منوی اپلیکیشن به‌صورت دکمه «تماس با پشتیبانی» نمایش داده می‌شود. خالی بگذارید تا دکمه نمایش داده نشود.",
    isPublic: true,
    key: "support_phone",
    label: "شماره تماس پشتیبانی",
    ltr: true,
    maxLength: 11,
    pattern: "^0\\d{10}$",
    patternMessage: "شماره باید ۱۱ رقم و با ۰ شروع شود؛ مثلاً 02112345678 یا 09121234567.",
    placeholder: "02112345678",
    section: "support",
    type: "string",
  },
  {
    default: "",
    group: "app",
    help: "زیر دکمه تماس در منوی اپلیکیشن نمایش داده می‌شود.",
    isPublic: true,
    key: "support_hours",
    label: "ساعات پاسخ‌گویی",
    maxLength: 80,
    placeholder: "شنبه تا چهارشنبه، ۸ تا ۱۷",
    section: "support",
    type: "string",
  },
  {
    default: 300,
    group: "search",
    help: "نزدیک‌ترین خدمات‌دهندگان واجد شرایط تا این تعداد برای هر درخواست پیدا می‌شوند.",
    isPublic: false,
    key: "candidate_limit",
    label: "حداکثر خدمات‌دهنده در نتیجه هر جستجو",
    max: 1000,
    min: 10,
    section: "search",
    type: "integer",
    unit: "نفر",
  },
  {
    default: 31,
    group: "search",
    help: "خدمات‌گیرنده در هر درخواست حداکثر این تعداد روز را می‌تواند انتخاب کند.",
    isPublic: true,
    key: "max_request_dates",
    label: "حداکثر روزهای قابل انتخاب در هر درخواست",
    max: 31,
    min: 1,
    section: "search",
    type: "integer",
    unit: "روز",
  },
  {
    default: 12,
    group: "providers",
    help: "سقف تعداد تصاویر نمونه‌کار هر خدمات‌دهنده. تصاویر موجودِ بیش از سقف حذف نمی‌شوند، فقط افزودن تصویر جدید ممکن نیست.",
    isPublic: false,
    key: "max_gallery_images",
    label: "حداکثر تصاویر گالری",
    max: 50,
    min: 1,
    section: "providers",
    type: "integer",
    unit: "تصویر",
  },
  {
    default: true,
    group: "subscriptions",
    help: "با خاموش کردن، خدمات‌دهندگان تا روشن شدن دوباره نمی‌توانند اشتراک جدید بخرند. اشتراک‌های فعال و پرداخت‌های در جریان تغییری نمی‌کنند.",
    isPublic: true,
    key: "purchase_enabled",
    label: "خرید اشتراک در اپلیکیشن",
    offLabel: "خرید موقتاً متوقف است",
    onLabel: "خدمات‌دهندگان می‌توانند اشتراک بخرند",
    section: "subscriptions",
    type: "boolean",
  },
] as const satisfies readonly SettingDefinition[];

export type SettingId = `${(typeof SETTINGS_REGISTRY)[number]["group"]}.${(typeof SETTINGS_REGISTRY)[number]["key"]}`;

type DefinitionById<Id extends SettingId> = Extract<
  (typeof SETTINGS_REGISTRY)[number],
  { group: Id extends `${infer G}.${string}` ? G : never; key: Id extends `${string}.${infer K}` ? K : never }
>;

/** The value type of a setting: string, number or boolean. */
export type SettingValueOf<Id extends SettingId> = DefinitionById<Id>["default"] extends string
  ? string
  : DefinitionById<Id>["default"] extends number
    ? number
    : boolean;

export function settingId(definition: { group: string; key: string }): string {
  return `${definition.group}.${definition.key}`;
}

export function findSettingDefinition(group: string, key: string): SettingDefinition | undefined {
  return (SETTINGS_REGISTRY as readonly SettingDefinition[]).find(
    (definition) => definition.group === group && definition.key === key,
  );
}

/**
 * Checks a value against its definition. Returns the normalised value or a
 * Persian error message.
 */
export function validateSettingValue(
  definition: SettingDefinition,
  raw: unknown,
): { ok: true; value: SettingValue } | { message: string; ok: false } {
  if (definition.type === "boolean") {
    return typeof raw === "boolean" ? { ok: true, value: raw } : { message: "مقدار باید روشن یا خاموش باشد.", ok: false };
  }
  if (definition.type === "integer") {
    const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
    if (typeof value !== "number" || !Number.isInteger(value)) return { message: "عدد صحیح وارد کنید.", ok: false };
    if (value < definition.min || value > definition.max) {
      return { message: `عدد باید بین ${definition.min} و ${definition.max} باشد.`, ok: false };
    }
    return { ok: true, value };
  }
  if (typeof raw !== "string") return { message: "مقدار متنی وارد کنید.", ok: false };
  const value = raw.trim();
  if (value.length > definition.maxLength) {
    return { message: `حداکثر ${definition.maxLength} نویسه مجاز است.`, ok: false };
  }
  if (value && definition.pattern && !new RegExp(definition.pattern).test(value)) {
    return { message: definition.patternMessage ?? "قالب مقدار معتبر نیست.", ok: false };
  }
  return { ok: true, value };
}

/** Value stored in the DB (JSON column) → typed value, or undefined when it does not fit the definition. */
export function coerceStoredValue(definition: SettingDefinition, stored: unknown): SettingValue | undefined {
  const result = validateSettingValue(definition, stored);
  return result.ok ? result.value : undefined;
}
