# نگاشت Domain، Tag و Storage

این ماتریس مالکیت API را تثبیت می‌کند. Route حق دسترسی مستقیم به storage ندارد و هر object فقط از Repository دامنه مالک خود استفاده می‌شود.

| API Domain / Tag | Tables / Views | Realm |
|---|---|---|
| App Auth | `users`, `user_otp_codes`, `user_sessions` | App |
| Admin Auth | `admins`, `admin_sessions`, `admin_password_reset_tokens` | Admin |
| Admin Management / RBAC | `admin_roles`, `admin_permissions`, `admin_role_assignments`, `admin_role_permissions`, `admin_permission_overrides` | Admin |
| Admin Management / Audit | `admin_audit_logs` | Admin |
| Catalog | `service_categories`, `services` | App + Admin |
| Provider | `provider_profiles`, `provider_services`, `provider_service_price_histories` | App + Admin |
| Consumer | `lands` | App |
| Subscription | `subscription_plans`, `provider_subscriptions` | App + Admin |
| Payments | `subscription_payments`, `payment_refunds` | App + Admin + Gateway |
| Search | `v_searchable_provider_services` | App read-only |
| Requests | `service_requests`, `service_request_dates`, `service_request_providers`, `service_request_status_histories`, `service_request_provider_histories` | App + Admin |
| Notifications | `notifications`, `notification_deliveries` | App + Admin + Worker |
| Admin Management / Moderation | `user_moderation_actions` | Admin |
| App System / Admin Management | `system_settings` | App public allow-list + Admin |
| Reports | `v_completed_service_request_financials` | App + Admin read-only |

## قواعد ثابت

- هر 31 جدول یک مالک اصلی دارد؛ Viewها فقط read-only هستند.
- Auth tableها فقط از Auth Repository همان realm مصرف می‌شوند.
- Request Service مالک انحصاری transition و relationهای چرخه درخواست است.
- Payment callback فقط Payment Service را فراخوانی می‌کند.
- mutationهای چندجدولی فقط از Service transaction عبور می‌کنند.
- Admin route از Service دامنه استفاده می‌کند و مسیر میان‌بر به جدول ندارد.
