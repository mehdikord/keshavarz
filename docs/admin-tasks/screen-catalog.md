# کاتالوگ صفحات — پنل ادمین و مهاجرت اپ

> Inventory صفحات هدف. جزئیات فیلتر/اکشن در فاز مربوطه و [`api-ui-mapping.md`](./api-ui-mapping.md) است.

## قرارداد URL

| سطح | پیشوند | مخاطب | الگوی UI |
|---|---|---|---|
| ادمین | `/admins` | اپراتور داخلی | Desktop-first، sidebar ثابت |
| اپ Provider | `/providers` | خدمات‌دهنده | Mobile shell + Dock |
| اپ Consumer | `/users` | خدمات‌گیرنده | Mobile shell + Dock |
| عمومی | `/` ، `/auth` ، `/profile` | همه کاربران اپ | Landing / OTP / پروفایل |

---

## A) پنل ادمین — `/admins`

### احراز هویت و حساب

| Route | صفحه | Permission |
|---|---|---|
| `/admins/login` | ورود موبایل + رمز | public |
| `/admins/me` | پروفایل مدیر جاری | session |
| `/admins/me/change-password` | تغییر رمز | session |

### هسته عملیاتی

| Route | صفحه | Permission |
|---|---|---|
| `/admins` یا `/admins/dashboard` | داشبورد KPI | `dashboard.view` |
| `/admins/users` | فهرست کاربران + فیلتر پیشرفته | `users.view` |
| `/admins/users/[userId]` | جزئیات کاربر + moderation timeline | `users.view` |
| `/admins/providers` | فهرست Providerها | `providers.view` |
| `/admins/providers/[providerId]` | جزئیات Provider، خدمات، اشتراک | `providers.view` |

### کاتالوگ

| Route | صفحه | Permission |
|---|---|---|
| `/admins/catalog/categories` | دسته‌ها | `catalog.view` |
| `/admins/catalog/services` | خدمات | `catalog.view` |
| `/admins/catalog/reorder` | مرتب‌سازی دسته/خدمت | `catalog.manage` |

### درخواست‌ها

| Route | صفحه | Permission |
|---|---|---|
| `/admins/service-requests` | فهرست درخواست‌ها | `requests.view` |
| `/admins/service-requests/[requestId]` | جزئیات + تاریخچه + مداخله | `requests.view` |

### اشتراک و مالی

| Route | صفحه | Permission |
|---|---|---|
| `/admins/subscription-plans` | پلن‌ها | `subscriptions.view` |
| `/admins/provider-subscriptions` | اشتراک‌های Provider | `subscriptions.view` |
| `/admins/payments` | پرداخت‌ها | `payments.view` |
| `/admins/payments/[paymentId]` | جزئیات پرداخت + refund | `payments.view` |
| `/admins/refunds` | فهرست refundها | `payments.view` |

### دسترسی و امنیت

| Route | صفحه | Permission |
|---|---|---|
| `/admins/admins` | مدیران | `admins.view` |
| `/admins/admins/[adminId]` | جزئیات/نقش/override/reset | `admins.view` |
| `/admins/roles` | نقش‌ها | `roles.view` |
| `/admins/roles/[roleId]` | مجوزهای نقش | `roles.view` |
| `/admins/permissions` | کاتالوگ مجوزها (read-only UI) | `roles.view` |
| `/admins/audit-logs` | Audit | `audit_logs.view` |
| `/admins/audit-logs/[auditLogId]` | جزئیات Audit | `audit_logs.view` |

### محتوا، گزارش و تنظیمات

| Route | صفحه | Permission |
|---|---|---|
| `/admins/notifications` | ارسال/مشاهده اعلان‌های مدیریتی | `notifications.view` / `send` |
| `/admins/reports/overview` | گزارش کلی | `reports.view` |
| `/admins/reports/financial` | گزارش مالی | `reports.view` |
| `/admins/exports` | وضعیت exportها | مجوز دامنه |
| `/admins/settings` | تنظیمات سیستم | `settings.view` |
| `/admins/jobs` *(اختیاری فاز ۰۹/۱۳)* | dead-letter و trigger job | ops permissions موجود |

### الگوی صفحه لیست استاندارد ادمین

هر صفحه لیست باید این بلوک‌ها را داشته باشد:

1. **Page header** — عنوان، توضیح کوتاه، primary CTA (در صورت مجوز)
2. **Toolbar** — جستجو سریع، فیلتر پیشرفته، reset، density، column visibility
3. **Active filter chips** — فیلترهای اعمال‌شده قابل حذف تکی
4. **DataTable** — skeleton، empty، error retry، row actions
5. **Pagination footer** — `hasMore` / next cursor / limit selector
6. **Detail** — صفحه کامل یا drawer برای رکورد انتخابی

---

## B) اپ — routeها و منبع داده واقعی

| Route | منبع داده |
|---|---|
| `/auth` | `/api/app/v1/auth/otp/*` + session cookie |
| `/profile` | `GET/PATCH /me` (+ image) |
| `/users/*` | `/api/app/v1/lands|consumer|service-searches|notifications|reports|...` |
| `/providers/*` | `/api/app/v1/provider/*` + subscriptions/payments/notifications/reports |
| Landing `/` | عمومی/استاتیک؛ داده حساس فقط از API |

> ساختار URL اپ حفظ شده؛ لایه Mock در فاز ۱۳ بازنشسته است.
