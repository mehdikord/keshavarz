import { ADMIN_PERMISSIONS, type AdminPermissionCode } from "@/lib/admin/permissions";

export interface PermissionMeta {
  code: AdminPermissionCode;
  description: string;
  label: string;
}

export interface PermissionGroup {
  label: string;
  module: string;
  permissions: PermissionMeta[];
}

const P = ADMIN_PERMISSIONS;

/** Every permission code, grouped by section, in the order the sidebar shows them. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "داشبورد",
    module: "dashboard",
    permissions: [{ code: P.dashboardView, description: "دیدن آمار کلی و داشبورد", label: "مشاهده داشبورد" }],
  },
  {
    label: "کاربران",
    module: "users",
    permissions: [
      { code: P.usersView, description: "فهرست و پرونده کامل کاربران", label: "مشاهده کاربران" },
      { code: P.usersUpdate, description: "ویرایش اطلاعات و یادداشت‌های کاربر", label: "ویرایش کاربران" },
      { code: P.usersChangeStatus, description: "تعلیق، مسدودسازی، حذف و بستن نشست‌ها", label: "تغییر وضعیت کاربران" },
    ],
  },
  {
    label: "خدمات‌دهندگان",
    module: "providers",
    permissions: [
      { code: P.providersView, description: "فهرست و پرونده خدمات‌دهندگان", label: "مشاهده خدمات‌دهندگان" },
      { code: P.providersUpdate, description: "خدمات، قیمت‌ها، محدوده و موقعیت", label: "ویرایش خدمات‌دهندگان" },
      { code: P.providersChangeStatus, description: "تأیید، فعال و غیرفعال کردن", label: "تغییر وضعیت خدمات‌دهندگان" },
    ],
  },
  {
    label: "کاتالوگ خدمات",
    module: "catalog",
    permissions: [
      { code: P.catalogView, description: "دیدن دسته‌ها و خدمات", label: "مشاهده کاتالوگ" },
      { code: P.catalogManage, description: "افزودن، ویرایش، تصویر و حذف خدمات و دسته‌ها", label: "مدیریت کاتالوگ" },
    ],
  },
  {
    label: "درخواست‌ها",
    module: "requests",
    permissions: [
      { code: P.requestsView, description: "فهرست و جزئیات درخواست‌ها", label: "مشاهده درخواست‌ها" },
      { code: P.requestsManage, description: "ثبت انجام کار و پس گرفتن دعوت", label: "مدیریت درخواست‌ها" },
      { code: P.requestsCancel, description: "لغو درخواست از طرف پشتیبانی", label: "لغو درخواست" },
    ],
  },
  {
    label: "اشتراک‌ها",
    module: "subscriptions",
    permissions: [
      { code: P.subscriptionsView, description: "اشتراک‌ها و پلن‌ها", label: "مشاهده اشتراک‌ها" },
      { code: P.subscriptionsManage, description: "تمدید و لغو اشتراک، مدیریت پلن‌ها", label: "مدیریت اشتراک‌ها" },
      { code: P.subscriptionsGrant, description: "اعطای اشتراک رایگان به خدمات‌دهنده", label: "اعطای اشتراک" },
    ],
  },
  {
    label: "پرداخت‌ها",
    module: "payments",
    permissions: [
      { code: P.paymentsView, description: "فهرست و جزئیات تراکنش‌ها", label: "مشاهده پرداخت‌ها" },
      { code: P.paymentsRefund, description: "ثبت بازپرداخت", label: "بازپرداخت" },
      { code: P.paymentsExport, description: "دریافت خروجی پرداخت‌ها", label: "خروجی پرداخت‌ها" },
    ],
  },
  {
    label: "اعلان‌ها",
    module: "notifications",
    permissions: [
      { code: P.notificationsView, description: "اعلان‌های ارسال‌شده و وضعیت تحویل", label: "مشاهده اعلان‌ها" },
      { code: P.notificationsSend, description: "ارسال اعلان به کاربران", label: "ارسال اعلان" },
    ],
  },
  {
    label: "گزارش‌ها",
    module: "reports",
    permissions: [
      { code: P.reportsView, description: "نمودارها و گزارش‌های مدیریتی", label: "مشاهده گزارش‌ها" },
      { code: P.reportsExport, description: "دریافت خروجی گزارش‌ها", label: "خروجی گزارش‌ها" },
    ],
  },
  {
    label: "مدیران",
    module: "admins",
    permissions: [
      { code: P.adminsView, description: "فهرست و پرونده مدیران", label: "مشاهده مدیران" },
      { code: P.adminsManage, description: "ساخت مدیر، نقش‌دهی، بازنشانی رمز و غیرفعال‌سازی", label: "مدیریت مدیران" },
    ],
  },
  {
    label: "نقش‌ها",
    module: "roles",
    permissions: [
      { code: P.rolesView, description: "دیدن نقش‌ها و دسترسی‌هایشان", label: "مشاهده نقش‌ها" },
      { code: P.rolesManage, description: "ساخت، ویرایش و حذف نقش", label: "مدیریت نقش‌ها" },
    ],
  },
  {
    label: "گزارش ممیزی",
    module: "audit_logs",
    permissions: [{ code: P.auditLogsView, description: "تاریخچه کامل کارهای مدیران", label: "مشاهده گزارش ممیزی" }],
  },
  {
    label: "تنظیمات",
    module: "settings",
    permissions: [
      { code: P.settingsView, description: "دیدن تنظیمات و وضعیت سامانه", label: "مشاهده تنظیمات" },
      { code: P.settingsManage, description: "تغییر تنظیمات سامانه", label: "تغییر تنظیمات" },
    ],
  },
];

const BY_CODE = new Map(PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => [item.code as string, item])));

export function permissionLabel(code: string): string {
  return BY_CODE.get(code)?.label ?? code;
}

/** Permission rows in the DB that the label map doesn't know yet still show up, under "other". */
export function groupPermissionCodes(codes: string[]): PermissionGroup[] {
  const known = new Set(BY_CODE.keys());
  const groups = PERMISSION_GROUPS.map((group) => ({
    ...group,
    permissions: group.permissions.filter((item) => codes.includes(item.code)),
  })).filter((group) => group.permissions.length > 0);
  const unknown = codes.filter((code) => !known.has(code));
  if (unknown.length) {
    groups.push({
      label: "سایر",
      module: "other",
      permissions: unknown.map((code) => ({ code: code as AdminPermissionCode, description: "", label: code })),
    });
  }
  return groups;
}

export const AUDIT_MODULE_LABELS: Record<string, string> = {
  account: "حساب من",
  auth: "ورود و خروج",
  billing: "اشتراک و پرداخت",
  catalog: "کاتالوگ خدمات",
  notifications: "اعلان‌ها",
  providers: "خدمات‌دهندگان",
  reports: "گزارش‌ها",
  requests: "درخواست‌ها",
  settings: "تنظیمات",
  subscriptions: "اشتراک‌ها",
  team: "مدیران و نقش‌ها",
  users: "کاربران",
};

export const AUDIT_SUBJECT_LABELS: Record<string, string> = {
  admin: "مدیر",
  admin_role: "نقش",
  provider_profile: "خدمات‌دهنده",
  provider_subscription: "اشتراک",
  service: "خدمت",
  service_category: "دسته‌بندی خدمت",
  ServiceCategory: "دسته‌بندی خدمت",
  service_request: "درخواست",
  subscription_payment: "پرداخت",
  subscription_plan: "پلن اشتراک",
  user: "کاربر",
};

const ACTION_LABELS: Record<string, string> = {
  "account.password_change": "تغییر رمز عبور خود",
  "account.profile": "ویرایش پروفایل خود",
  "account.sessions_revoke": "بستن نشست‌های خود",
  "auth.locked": "قفل شدن ورود",
  "auth.login": "ورود به پنل",
  "auth.logout": "خروج از پنل",
  "billing.payments.refund": "ثبت بازپرداخت",
  "billing.plans.activate": "فعال کردن پلن",
  "billing.plans.create": "ساخت پلن",
  "billing.plans.deactivate": "غیرفعال کردن پلن",
  "billing.plans.delete": "حذف پلن",
  "billing.plans.reorder": "ترتیب پلن‌ها",
  "billing.plans.update": "ویرایش پلن",
  "billing.subscriptions.cancel": "لغو اشتراک",
  "billing.subscriptions.extend": "تمدید اشتراک",
  "billing.subscriptions.grant": "اعطای اشتراک",
  "catalog.categories.activate": "فعال کردن دسته",
  "catalog.categories.create": "ساخت دسته",
  "catalog.categories.deactivate": "غیرفعال کردن دسته",
  "catalog.categories.delete": "حذف دسته",
  "catalog.categories.image_remove": "حذف تصویر دسته",
  "catalog.categories.image_upload": "بارگذاری تصویر دسته",
  "catalog.categories.reorder": "ترتیب دسته‌ها",
  "catalog.categories.update": "ویرایش دسته",
  "catalog.services.activate": "فعال کردن خدمت",
  "catalog.services.create": "ساخت خدمت",
  "catalog.services.deactivate": "غیرفعال کردن خدمت",
  "catalog.services.delete": "حذف خدمت",
  "catalog.services.image_remove": "حذف تصویر خدمت",
  "catalog.services.image_upload": "بارگذاری تصویر خدمت",
  "catalog.services.reorder": "ترتیب خدمات",
  "catalog.services.update": "ویرایش خدمت",
  "notifications.broadcast": "ارسال اعلان همگانی",
  "providers.activate": "فعال کردن خدمات‌دهنده",
  "providers.approve": "تأیید خدمات‌دهنده",
  "providers.deactivate": "غیرفعال کردن خدمات‌دهنده",
  "providers.gallery.delete": "حذف تصویر گالری",
  "providers.services.activate": "فعال کردن خدمت خدمات‌دهنده",
  "providers.services.add": "افزودن خدمت به خدمات‌دهنده",
  "providers.services.deactivate": "غیرفعال کردن خدمت خدمات‌دهنده",
  "providers.services.delete": "حذف خدمت خدمات‌دهنده",
  "providers.services.update": "ویرایش قیمت خدمت",
  "providers.unapprove": "لغو تأیید خدمات‌دهنده",
  "providers.update": "ویرایش پروفایل خدمات‌دهنده",
  "providers.work_area": "ویرایش محدوده و موقعیت",
  "requests.cancel": "لغو درخواست",
  "requests.complete": "ثبت انجام درخواست",
  "requests.withdraw_provider": "پس گرفتن دعوت",
  "team.admins.activate": "فعال کردن مدیر",
  "team.admins.create": "ساخت مدیر",
  "team.admins.deactivate": "غیرفعال کردن مدیر",
  "team.admins.override_remove": "حذف استثنای دسترسی",
  "team.admins.override_set": "ثبت استثنای دسترسی",
  "team.admins.password_reset": "بازنشانی رمز مدیر",
  "team.admins.roles": "تغییر نقش‌های مدیر",
  "team.admins.sessions_revoke": "بستن نشست‌های مدیر",
  "team.admins.super_grant": "اعطای سطح مدیر ارشد",
  "team.admins.super_revoke": "گرفتن سطح مدیر ارشد",
  "team.admins.unlock": "رفع قفل ورود",
  "team.admins.update": "ویرایش مدیر",
  "team.roles.create": "ساخت نقش",
  "team.roles.delete": "حذف نقش",
  "team.roles.update": "ویرایش نقش",
  "users.delete": "حذف حساب کاربر",
  "users.moderation": "اقدام انضباطی روی کاربر",
  "users.note.create": "یادداشت روی کاربر",
  "users.note.delete": "حذف یادداشت کاربر",
  "users.note.pin": "سنجاق یادداشت",
  "users.note.unpin": "برداشتن سنجاق یادداشت",
  "users.restore": "بازگردانی حساب کاربر",
  "users.sessions.revoke": "بستن نشست کاربر",
  "users.update": "ویرایش کاربر",
};

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function auditModuleLabel(module: string): string {
  return AUDIT_MODULE_LABELS[module] ?? module;
}

/** Short device description from a user agent. */
export function describeAgent(userAgent: string | null): string {
  if (!userAgent) return "مرورگر نامشخص";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Chrome\//.test(userAgent)
      ? "Chrome"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : null;
  const os = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : null;
  return [browser, os].filter(Boolean).join(" روی ") || "مرورگر نامشخص";
}
