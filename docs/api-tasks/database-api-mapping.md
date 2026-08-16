# نگاشت دیتابیس به API و فازهای اجرا

> هدف این ماتریس، اثبات پوشش تمام objectهای `docs/database.schema` است. دسترسی واقعی هر جدول فقط از Service/Repository مالک آن انجام می‌شود.

## کاربران اپ و نشست

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `users` | Identity/Profile | ایجاد در verify OTP، خواندن/ویرایش پروفایل، moderation | ۰۳، ۰۵، ۱۰ |
| `user_otp_codes` | App Auth | request/verify/resend و cleanup | ۰۳، ۱۲ |
| `user_sessions` | App Auth | refresh/revoke/list و cleanup | ۰۳، ۱۲ |

## مدیران و RBAC

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `admins` | Admin Identity | login، پروفایل، CRUD/status/reset | ۰۴، ۱۰ |
| `admin_roles` | RBAC | CRUD نقش | ۰۴، ۱۰ |
| `admin_permissions` | RBAC | catalog مجوزها؛ معمولاً seed/system-managed | ۰۱، ۰۴، ۱۰ |
| `admin_role_assignments` | RBAC | تخصیص نقش با expiry | ۰۴، ۱۰ |
| `admin_role_permissions` | RBAC | sync مجوزهای نقش | ۰۴، ۱۰ |
| `admin_permission_overrides` | RBAC | allow/deny اختصاصی با expiry | ۰۴، ۱۰ |
| `admin_sessions` | Admin Auth | login/refresh/revoke | ۰۴، ۱۲ |
| `admin_password_reset_tokens` | Admin Auth | reset کنترل‌شده در صورت تصویب جریان | ۰۴، ۱۰ |
| `admin_audit_logs` | Audit | append-only mutation log و query | ۰۴، ۱۰، ۱۲ |

## کاتالوگ، Provider و زمین

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `service_categories` | Catalog | read اپ، CRUD/reorder مدیریت | ۰۵، ۱۰ |
| `services` | Catalog | read اپ، CRUD/reorder مدیریت | ۰۵، ۱۰ |
| `provider_profiles` | Provider | work area/profile/approval/availability | ۰۵، ۱۰ |
| `provider_services` | Provider Services | add/update/deactivate/search | ۰۵، ۰۷، ۱۰ |
| `provider_service_price_histories` | Provider Services | append در تغییر قیمت، مشاهده مدیریتی | ۰۵، ۱۰ |
| `lands` | Consumer Lands | CRUD مالک، snapshot در Request | ۰۵، ۰۷، ۰۸ |

## اشتراک و پرداخت

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `subscription_plans` | Subscription Catalog | read اپ، CRUD مدیریت | ۰۶، ۱۰ |
| `provider_subscriptions` | Subscription | purchase/grant/activate/cancel/expire | ۰۶، ۱۰، ۱۲ |
| `subscription_payments` | Payment | initiate/verify/callback/list | ۰۶، ۱۰، ۱۲ |
| `payment_refunds` | Refund | request/process/reconcile | ۰۶، ۱۰، ۱۲ |

## چرخه درخواست

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `service_requests` | Request | create/list/detail/accept/cancel/complete | ۰۸، ۱۰، ۱۱ |
| `service_request_dates` | Request | درج تاریخ‌های immutable هنگام ایجاد | ۰۸ |
| `service_request_providers` | Request Matching | send/view/accept/reject/remove | ۰۸، ۱۰ |
| `service_request_status_histories` | Request History | append هر transition و مشاهده | ۰۸، ۱۰ |
| `service_request_provider_histories` | Provider Link History | append هر transition link و مشاهده | ۰۸، ۱۰ |

## اعلان، Moderation و تنظیمات

| Object | مالک اصلی | عملیات API | فاز |
|---|---|---|---|
| `notifications` | Notification | create/list/read و admin send | ۰۸، ۰۹، ۱۰ |
| `notification_deliveries` | Delivery Worker | queue/send/retry/reconcile | ۰۹، ۱۲ |
| `user_moderation_actions` | Moderation | append action و timeline | ۱۰ |
| `system_settings` | Settings | public allow-list و CRUD مجوزدار | ۰۰، ۱۰ |

## Viewهای خواندنی

| View | مصرف‌کننده | کاربرد | فاز |
|---|---|---|---|
| `v_searchable_provider_services` | Search Repository | eligibility و ورودی محاسبه فاصله | ۰۷ |
| `v_completed_service_request_financials` | Report Repository | هزینه/درآمد completed | ۱۱ |

## قواعد مالکیت داده

- جدول‌های OTP/session/password reset فقط از ماژول Auth قابل دسترسی‌اند.
- history و audit append-only هستند؛ API ویرایش/حذف ندارند.
- Payment callback فقط Payment Service را صدا می‌زند و مستقیم subscription را دستکاری نمی‌کند.
- Request Service تنها مالک transitionهای `service_requests` و relationهای آن است.
- Report Service فقط read دارد و وضعیت یا مبلغ تراکنشی را تغییر نمی‌دهد.
- Admin route نیز قواعد دامنه را از همان Serviceها اجرا می‌کند و مسیر میان‌بُر DB ندارد.

## معیار پوشش

- [ ] هر ۳۱ جدول دقیقاً یک مالک اصلی دارد.
- [ ] هر ۲ View فقط برای read استفاده می‌شود.
- [ ] هیچ Route Handler مستقیم روی جدول نامرتبط query نمی‌زند.
- [ ] تمام mutationهای چندجدولی از Service transaction عبور می‌کنند.
