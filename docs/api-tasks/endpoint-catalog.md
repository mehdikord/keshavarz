# کاتالوگ Endpointهای API

> این سند inventory اولیه API است. نام دقیق DTOها و status codeها در فاز ۰۰ تثبیت و در OpenAPI ثبت می‌شود.

## قراردادهای عمومی

- Base URL اپ: `/api/app/v1`
- Base URL مدیریت: `/api/admins/v1`
- endpointهای collection با cursor pagination کار می‌کنند.
- فیلترها در query string و actionهای stateful در sub-resourceهای صریح قرار می‌گیرند.
- منابع عمومی با ULID (`public_id`) آدرس‌دهی می‌شوند.
- `DELETE` برای داده تاریخی استفاده نمی‌شود؛ deactivate/soft-delete ترجیح دارد.

## API اپلیکیشن — عمومی و احراز هویت

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/health` | سلامت سطح API بدون اطلاعات زیرساخت حساس |
| `GET` | `/api/app/v1/health/authenticated` | نمونه قرارداد مشترک endpoint محافظت‌شده کاربر |
| `GET` | `/api/app/v1/public/settings` | تنظیمات public allow-list |
| `POST` | `/api/app/v1/auth/otp/request` | درخواست OTP ورود |
| `POST` | `/api/app/v1/auth/otp/verify` | تأیید OTP، ایجاد کاربر در اولین ورود و ساخت نشست |
| `POST` | `/api/app/v1/auth/otp/resend` | ارسال مجدد با cooldown |
| `POST` | `/api/app/v1/auth/session/refresh` | rotation نشست فعال |
| `DELETE` | `/api/app/v1/auth/session` | خروج از نشست جاری |
| `DELETE` | `/api/app/v1/auth/sessions` | خروج از همه دستگاه‌ها |
| `GET` | `/api/app/v1/me` | اطلاعات کاربر جاری و قابلیت‌های Consumer/Provider |
| `PATCH` | `/api/app/v1/me` | نام، locale، timezone و استان/شهر سکونت |
| `PUT` | `/api/app/v1/me/image` | ثبت/جایگزینی تصویر با upload امن |
| `DELETE` | `/api/app/v1/me/image` | حذف تصویر |
| `GET` | `/api/app/v1/me/sessions` | فهرست نشست‌های کاربر |
| `DELETE` | `/api/app/v1/me/sessions/{sessionId}` | revoke دستگاه دیگر |

## API اپلیکیشن — مکان (استان و شهر)

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/locations/provinces` | استان‌های فعال برای پروفایل و فرم‌ها |
| `GET` | `/api/app/v1/locations/provinces/{provinceId}/cities` | شهرهای یک استان برای select وابسته |

## API اپلیکیشن — کاتالوگ و زمین

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/catalog/categories` | دسته‌های فعال |
| `GET` | `/api/app/v1/catalog/categories/{categoryId}/services` | خدمات فعال دسته |
| `GET` | `/api/app/v1/catalog/services/{serviceId}` | جزئیات خدمت فعال |
| `GET` | `/api/app/v1/lands` | زمین‌های کاربر جاری |
| `POST` | `/api/app/v1/lands` | ایجاد زمین |
| `GET` | `/api/app/v1/lands/{landId}` | مشاهده زمین با ownership |
| `PATCH` | `/api/app/v1/lands/{landId}` | ویرایش زمین |
| `DELETE` | `/api/app/v1/lands/{landId}` | soft-delete زمین در صورت مجاز بودن |

## API اپلیکیشن — قابلیت‌های Provider

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/provider/profile` | پروفایل Provider کاربر جاری |
| `PUT` | `/api/app/v1/provider/profile` | ایجاد یا تکمیل پروفایل |
| `PATCH` | `/api/app/v1/provider/work-area` | مرکز، شعاع ۲۰ تا ۱۰۰ km و availability |
| `GET` | `/api/app/v1/provider/services` | خدمات قابل ارائه |
| `POST` | `/api/app/v1/provider/services` | افزودن خدمت غیرتکراری |
| `PATCH` | `/api/app/v1/provider/services/{providerServiceId}` | قیمت، واحد و توضیح |
| `DELETE` | `/api/app/v1/provider/services/{providerServiceId}` | غیرفعال‌سازی خدمت |
| `GET` | `/api/app/v1/provider/dashboard` | شمارنده‌ها، درآمد و هشدار اشتراک |

## API اپلیکیشن — اشتراک و پرداخت

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/subscription/plans` | پلن‌های فعال |
| `GET` | `/api/app/v1/provider/subscription` | اشتراک فعال و وضعیت eligibility |
| `GET` | `/api/app/v1/provider/subscriptions` | تاریخچه اشتراک‌ها |
| `POST` | `/api/app/v1/provider/subscriptions/purchase` | ایجاد اشتراک pending و payment initiated |
| `GET` | `/api/app/v1/payments` | تاریخچه پرداخت کاربر |
| `GET` | `/api/app/v1/payments/{paymentId}` | جزئیات پرداخت |
| `POST` | `/api/app/v1/payments/{paymentId}/verify` | verify بازگشت کاربر، idempotent |
| `POST` | `/api/app/v1/payment-gateways/{gateway}/callback` | callback امضاشده درگاه |

## API اپلیکیشن — جستجو و درخواست

| Method | Route | کاربرد |
|---|---|---|
| `POST` | `/api/app/v1/service-searches` | اعتبارسنجی زمین/خدمت/تاریخ و ایجاد context جستجو |
| `GET` | `/api/app/v1/service-searches/{searchId}/providers` | نتایج مرتب‌شونده Providerها |
| `POST` | `/api/app/v1/service-requests` | ایجاد Request از context معتبر و حداقل یک Provider |
| `POST` | `/api/app/v1/service-requests/{requestId}/providers` | ارسال همان Request به Providerهای بیشتر |
| `GET` | `/api/app/v1/consumer/requests` | درخواست‌های Consumer با فیلتر status |
| `GET` | `/api/app/v1/consumer/requests/{requestId}` | جزئیات درخواست متعلق به Consumer |
| `POST` | `/api/app/v1/consumer/requests/{requestId}/cancel` | لغو pending یا in-progress طبق قانون |
| `POST` | `/api/app/v1/consumer/requests/{requestId}/complete` | پایان کار فقط توسط Consumer |
| `GET` | `/api/app/v1/provider/requests` | inbox خدمات‌دهنده با فیلتر status |
| `GET` | `/api/app/v1/provider/requests/{requestId}` | جزئیات مجاز Provider |
| `POST` | `/api/app/v1/provider/requests/{requestId}/view` | ثبت viewed_at به‌شکل idempotent |
| `POST` | `/api/app/v1/provider/requests/{requestId}/accept` | قبول تراکنشی و حذف سایر Providerها |
| `POST` | `/api/app/v1/provider/requests/{requestId}/reject` | رد فقط رابطه همان Provider |
| `POST` | `/api/app/v1/provider/requests/{requestId}/cancel` | لغو in-progress با دلیل |

## API اپلیکیشن — اعلان و گزارش

| Method | Route | کاربرد |
|---|---|---|
| `GET` | `/api/app/v1/notifications` | اعلان‌های کاربر |
| `GET` | `/api/app/v1/notifications/unread-count` | تعداد خوانده‌نشده |
| `POST` | `/api/app/v1/notifications/{notificationId}/read` | خواندن یک اعلان |
| `POST` | `/api/app/v1/notifications/read-all` | خواندن همه تا timestamp مشخص |
| `GET` | `/api/app/v1/consumer/reports/financial-summary` | هزینه completedها |
| `GET` | `/api/app/v1/consumer/reports/monthly-costs` | سری زمانی هزینه |
| `GET` | `/api/app/v1/provider/reports/financial-summary` | درآمد completedها |
| `GET` | `/api/app/v1/provider/reports/monthly-revenue` | سری زمانی درآمد |

## API مدیریت — احراز هویت

| Method | Route | Permission |
|---|---|---|
| `GET` | `/api/admins/v1/health/authenticated` | نمونه قرارداد مشترک endpoint محافظت‌شده مدیر |
| `POST` | `/api/admins/v1/auth/login` | public؛ موبایل + رمز |
| `POST` | `/api/admins/v1/auth/session/refresh` | admin session |
| `DELETE` | `/api/admins/v1/auth/session` | admin session |
| `DELETE` | `/api/admins/v1/auth/sessions` | admin session |
| `GET` | `/api/admins/v1/me` | admin session |
| `PATCH` | `/api/admins/v1/me` | admin session |
| `POST` | `/api/admins/v1/me/change-password` | admin session + current password |

## API مدیریت — Dashboard، کاربران و Providerها

| Method | Route | Permission |
|---|---|---|
| `GET` | `/api/admins/v1/dashboard` | `dashboard.view` |
| `GET` | `/api/admins/v1/users` | `users.view` |
| `GET` | `/api/admins/v1/users/{userId}` | `users.view` |
| `PATCH` | `/api/admins/v1/users/{userId}` | `users.update` |
| `POST` | `/api/admins/v1/users/{userId}/moderation-actions` | `users.change_status` |
| `GET` | `/api/admins/v1/users/{userId}/moderation-actions` | `users.view` |
| `GET` | `/api/admins/v1/providers` | `providers.view` |
| `GET` | `/api/admins/v1/providers/{providerId}` | `providers.view` |
| `PATCH` | `/api/admins/v1/providers/{providerId}` | `providers.update` |
| `POST` | `/api/admins/v1/providers/{providerId}/approve` | `providers.change_status` |
| `POST` | `/api/admins/v1/providers/{providerId}/availability` | `providers.change_status` |
| `GET` | `/api/admins/v1/providers/{providerId}/services` | `providers.view` |
| `PATCH` | `/api/admins/v1/provider-services/{providerServiceId}` | `providers.update` |

## API مدیریت — کاتالوگ

| Method | Route | Permission |
|---|---|---|
| `GET` | `/api/admins/v1/catalog/categories` | `catalog.view` |
| `POST` | `/api/admins/v1/catalog/categories` | `catalog.manage` |
| `PATCH` | `/api/admins/v1/catalog/categories/{categoryId}` | `catalog.manage` |
| `DELETE` | `/api/admins/v1/catalog/categories/{categoryId}` | `catalog.manage` |
| `GET` | `/api/admins/v1/catalog/services` | `catalog.view` |
| `POST` | `/api/admins/v1/catalog/services` | `catalog.manage` |
| `PATCH` | `/api/admins/v1/catalog/services/{serviceId}` | `catalog.manage` |
| `DELETE` | `/api/admins/v1/catalog/services/{serviceId}` | `catalog.manage` |
| `POST` | `/api/admins/v1/catalog/reorder` | `catalog.manage` |

## API مدیریت — درخواست‌ها، اشتراک و مالی

| Method | Route | Permission |
|---|---|---|
| `GET` | `/api/admins/v1/service-requests` | `requests.view` |
| `GET` | `/api/admins/v1/service-requests/{requestId}` | `requests.view` |
| `GET` | `/api/admins/v1/service-requests/{requestId}/histories` | `requests.view` |
| `POST` | `/api/admins/v1/service-requests/{requestId}/cancel` | `requests.cancel` |
| `POST` | `/api/admins/v1/service-request-providers/{linkId}/remove` | `requests.manage` |
| `GET` | `/api/admins/v1/subscription-plans` | `subscriptions.view` |
| `POST` | `/api/admins/v1/subscription-plans` | `subscriptions.manage` |
| `PATCH` | `/api/admins/v1/subscription-plans/{planId}` | `subscriptions.manage` |
| `DELETE` | `/api/admins/v1/subscription-plans/{planId}` | `subscriptions.manage` |
| `GET` | `/api/admins/v1/provider-subscriptions` | `subscriptions.view` |
| `POST` | `/api/admins/v1/providers/{providerId}/subscriptions/grant` | `subscriptions.grant` |
| `POST` | `/api/admins/v1/provider-subscriptions/{subscriptionId}/cancel` | `subscriptions.manage` |
| `GET` | `/api/admins/v1/payments` | `payments.view` |
| `GET` | `/api/admins/v1/payments/{paymentId}` | `payments.view` |
| `POST` | `/api/admins/v1/payments/{paymentId}/refunds` | `payments.refund` |
| `GET` | `/api/admins/v1/refunds` | `payments.view` |

## API مدیریت — مدیران و RBAC

| Method | Route | Permission |
|---|---|---|
| `GET` | `/api/admins/v1/admins` | `admins.view` |
| `POST` | `/api/admins/v1/admins` | `admins.manage` |
| `GET` | `/api/admins/v1/admins/{adminId}` | `admins.view` |
| `PATCH` | `/api/admins/v1/admins/{adminId}` | `admins.manage` |
| `POST` | `/api/admins/v1/admins/{adminId}/status` | `admins.manage` |
| `POST` | `/api/admins/v1/admins/{adminId}/reset-password` | `admins.manage` |
| `GET` | `/api/admins/v1/roles` | `roles.view` |
| `POST` | `/api/admins/v1/roles` | `roles.manage` |
| `PATCH` | `/api/admins/v1/roles/{roleId}` | `roles.manage` |
| `DELETE` | `/api/admins/v1/roles/{roleId}` | `roles.manage` |
| `PUT` | `/api/admins/v1/roles/{roleId}/permissions` | `roles.manage` |
| `PUT` | `/api/admins/v1/admins/{adminId}/roles` | `admins.manage` |
| `PUT` | `/api/admins/v1/admins/{adminId}/permission-overrides` | `admins.manage` |
| `GET` | `/api/admins/v1/permissions` | `roles.view` |

## API مدیریت — اعلان، گزارش، تنظیمات و Audit

| Method | Route | Permission |
|---|---|---|
| `POST` | `/api/admins/v1/notifications` | `notifications.send` |
| `GET` | `/api/admins/v1/notifications` | `notifications.view` |
| `GET` | `/api/admins/v1/reports/overview` | `reports.view` |
| `GET` | `/api/admins/v1/reports/financial` | `reports.view` |
| `POST` | `/api/admins/v1/exports` | مجوز export دامنه مربوط |
| `GET` | `/api/admins/v1/exports/{exportId}` | مجوز export دامنه مربوط |
| `GET` | `/api/admins/v1/settings` | `settings.view` |
| `PUT` | `/api/admins/v1/settings/{group}/{key}` | `settings.manage` |
| `GET` | `/api/admins/v1/audit-logs` | `audit_logs.view` |
| `GET` | `/api/admins/v1/audit-logs/{auditLogId}` | `audit_logs.view` |

## مواردی که قبل از تثبیت OpenAPI باید تصمیم‌گیری شوند

- قرارداد واقعی درگاه پرداخت و endpoint callback هر provider.
- ارائه‌دهنده SMS، قالب پیام و سیاست retry.
- storage تصویر و قرارداد signed upload.
- نیاز یا عدم نیاز به password reset self-service برای مدیران.
- محدودیت حجم export و مدت نگهداری فایل خروجی.
