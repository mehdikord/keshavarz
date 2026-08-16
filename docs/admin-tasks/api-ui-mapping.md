# نگاشت UI به Endpoint و Permission

> مرجع اتصال صفحه/اکشن به API. Baseها: `/api/admins/v1` و `/api/app/v1`.

## قواعد مشترک

- همه collectionها: `cursor`, `limit`, `sort`, `direction` طبق schema همان ماژول
- mutationهای حساس: confirmation UI + در صورت وجود، `reason` / `Idempotency-Key`
- UI permission gate با همان codeهای seed (`dashboard.view`, `users.view`, ...)

---

## Admin Auth & Me

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Login submit | `POST` | `/auth/login` | public |
| Refresh session | `POST` | `/auth/session/refresh` | session |
| Logout | `DELETE` | `/auth/session` | session |
| Logout all | `DELETE` | `/auth/sessions` | session |
| Profile view/edit | `GET`/`PATCH` | `/me` | session |
| Change password | `POST` | `/me/change-password` | session |

## Dashboard & Ops

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| KPI cards / charts | `GET` | `/dashboard` | `dashboard.view` |
| Metrics strip | `GET` | `/metrics` | `dashboard.view` |
| Auth health check | `GET` | `/health/authenticated` | session |
| Run jobs (ops) | `POST` | `/jobs/run` | ops (طبق API) |
| Dead-letter lists/replay | `GET`/`POST` | `/jobs/dead-letters/...` | ops |

## Users

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Users table | `GET` | `/users?q&isActive&cursor&limit` | `users.view` |
| User detail | `GET` | `/users/{userId}` | `users.view` |
| Edit allowed fields | `PATCH` | `/users/{userId}` | `users.update` |
| Moderation action | `POST` | `/users/{userId}/moderation-actions` | `users.change_status` |
| Moderation timeline | `GET` | `/users/{userId}/moderation-actions` | `users.view` |

**فیلترهای الزامی UI کاربران:** جستجو (`q` روی نام/موبایل)، وضعیت فعال، بازه ایجاد (اگر API بعداً گسترش یافت در همین ماتریس ثبت شود)، sort `createdAt`.

## Providers

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Providers table | `GET` | `/providers` | `providers.view` |
| Provider detail | `GET` | `/providers/{providerId}` | `providers.view` |
| Update profile fields | `PATCH` | `/providers/{providerId}` | `providers.update` |
| Approve | `POST` | `/providers/{providerId}/approve` | `providers.change_status` |
| Availability | `POST` | `/providers/{providerId}/availability` | `providers.change_status` |
| Provider services | `GET` | `/providers/{providerId}/services` | `providers.view` |
| Patch provider service | `PATCH` | `/provider-services/{providerServiceId}` | `providers.update` |
| Grant subscription | `POST` | `/providers/{providerId}/subscriptions/grant` | `subscriptions.grant` |

## Catalog

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Categories list/create | `GET`/`POST` | `/catalog/categories` | view / manage |
| Category patch/delete | `PATCH`/`DELETE` | `/catalog/categories/{categoryId}` | manage |
| Services list/create | `GET`/`POST` | `/catalog/services` | view / manage |
| Service patch/delete | `PATCH`/`DELETE` | `/catalog/services/{serviceId}` | manage |
| Reorder | `POST` | `/catalog/reorder` | manage |

## Service Requests

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Requests table | `GET` | `/service-requests` | `requests.view` |
| Detail | `GET` | `/service-requests/{requestId}` | `requests.view` |
| Histories | `GET` | `/service-requests/{requestId}/histories` | `requests.view` |
| Admin cancel | `POST` | `/service-requests/{requestId}/cancel` | `requests.cancel` |
| Remove provider link | `POST` | `/service-request-providers/{linkId}/remove` | `requests.manage` |

**فیلترهای الزامی UI درخواست:** status، جستجو، بازه تاریخ، consumer/provider id در صورت پشتیبانی schema، sort.

## Subscriptions & Payments

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Plans CRUD | `GET`/`POST`/`PATCH`/`DELETE` | `/subscription-plans` | view / manage |
| Provider subscriptions | `GET` | `/provider-subscriptions` | view |
| Cancel subscription | `POST` | `/provider-subscriptions/{subscriptionId}/cancel` | manage |
| Payments list/detail | `GET` | `/payments`, `/payments/{paymentId}` | `payments.view` |
| Create refund | `POST` | `/payments/{paymentId}/refunds` | `payments.refund` |
| Refunds list | `GET` | `/refunds` | `payments.view` |

## RBAC

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Admins CRUD/status/reset | `/admins` ... | `admins.view` / `admins.manage` |
| Assign roles | `PUT` | `/admins/{adminId}/roles` | manage |
| Permission overrides | `PUT` | `/admins/{adminId}/permission-overrides` | manage |
| Roles CRUD | `/roles` ... | `roles.view` / `roles.manage` |
| Role permissions replace | `PUT` | `/roles/{roleId}/permissions` | manage |
| Permissions catalog | `GET` | `/permissions` | `roles.view` |

## Notifications / Reports / Settings / Audit

| UI | Method | Endpoint | Permission |
|---|---|---|---|
| Admin notifications | `GET`/`POST` | `/notifications` | view / send |
| Overview report | `GET` | `/reports/overview` | `reports.view` |
| Financial report | `GET` | `/reports/financial` | `reports.view` |
| Exports | `POST`/`GET` | `/exports`, `/exports/{exportId}` | domain export |
| Settings | `GET`/`PUT` | `/settings`, `/settings/{group}/{key}` | view / manage |
| Audit | `GET` | `/audit-logs`, `/audit-logs/{auditLogId}` | `audit_logs.view` |

---

## App UI → App API (مهاجرت)

| دامنه UI | Endpointهای اصلی |
|---|---|
| Auth OTP | `/auth/otp/request|verify|resend`, `/auth/session*` |
| Me / sessions | `/me`, `/me/image`, `/me/sessions*` |
| Catalog | `/catalog/categories`, `/catalog/categories/{id}/services`, `/catalog/services/{id}` |
| Lands | `/lands`, `/lands/{landId}` |
| Provider profile/services | `/provider/profile`, `/provider/work-area`, `/provider/services*` |
| Provider dashboard | `/provider/dashboard` |
| Search & request create | `/service-searches*`, `/service-requests*` |
| Consumer requests | `/consumer/requests*` |
| Provider requests | `/provider/requests*` |
| Subscriptions/payments | `/subscription/plans`, `/provider/subscription*`, `/payments*` |
| Notifications | `/notifications*` |
| Reports | `/consumer/reports/*`, `/provider/reports/*` |

جزئیات جایگزینی فایل‌های mock در [`mock-to-api-migration-matrix.md`](./mock-to-api-migration-matrix.md).
