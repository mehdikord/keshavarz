# Runbook رخدادها

> برای هر رخداد: صاحب (owner)، نشانه‌ها، تشخیص، بازگشت سرویس و اقدام پیشگیرانه.
> اصول کلی: هیچ‌وقت اطلاعات حساس در log/backtrace ننویسید؛ هر action غیرمعمول باید audit شود.

---

## ۱. اختلال ارسال SMS

| بخش | توضیح |
|---|---|
| **Owner** | SRE / سرویس پیامک (اسپانسر: تیم احراز هویت) |
| **نشانه‌ها** | OTP کار می‌کند ولی کد نمی‌رسد؛ افزایش `sms_delivery_failed` در metrics؛ خطای غیر-200 از `SMS_QUEUE_URL`؛ صف `notification_deliveries` با `channel=sms` در stateهای retry/dead-letter |
| **Impact** | ورود/ثبت‌نام کاربران جدید مختل؛ سایر سرویس‌ها سالم |
| **تشخیص** | `GET /api/admins/v1/jobs/dead-letters/notifications` و بررسی `lastError`؛ مشاهده alert `job_failure` مربوط به `notification-deliveries`؛ تست دستی `POST /api/app/v1/auth/otp/request` |
| **بازگشت سرویس** | ۱) اگر outage مربوط به gateway باشد: failover به gateway دوم (کدام env؟ مطابق SRE). ۲) replay صف از endpooint مدیریتی. ۳) در غیر این صورت راه‌اندازی مجدد worker. |
| **اقدام پیشگیرانه** | مانیتور SLO ارسال SMS؛ alert روی تاخیر > ۵ دقیقه؛ کانال fallback در نظر گرفته شود. |

---

## ۲. اختلال Callback پرداخت

| بخش | توضیح |
|---|---|
| **Owner** | SRE / تیم پرداخت |
| **نشانه‌ها** | افزایش dead-letter در `payments`؛ alert `payment_mismatch`؛ درخواست‌های مشتری برای اشتراکی که پرداخت شده ولی فعال نشده |
| **Impact** | اشتراک Provider فعال نمی‌شود؛ درآمد نهایی‌سازی نمی‌شود |
| **تشخیص** | `GET /api/admins/v1/jobs/dead-letters/payments`؛ بررسی `invalid_signature` (مشکل امضا → احتمال drift secret درگاه) در برابر `payment_not_found`/`activation_failed` |
| **بازگشت سرویس** | ۱) رفع root cause درگاه. ۲) replay دستی dead-letter از پنل مدیریت (action: `replay-payment-callback`). ۳) اگر amount mismatch: بررسی رکورد `subscription_payments` و اصلاح وضعیت به‌صورت دستی با تأیید مالی. |
| **اقدام پیشگیرانه** | idempotency callback؛ reconcile روزانه `payment-reconciliation`؛ alert threshold روی backlog > N رکورد. |

---

## ۳. شکست Migration دیتابیس

| بخش | توضیح |
|---|---|
| **Owner** | DBA / Tech Lead |
| **نشانه‌ها** | exit غیرصفر `prisma migrate deploy`؛ خطای drift؛ queryهای کند یا خطای column not found پس از deploy |
| **Impact** | قطع کامل یا partial سرویس |
| **تشخیص** | `pnpm db:migrate:status`؛ مقایسه `docs/database.schema` با migration؛ بررسی `prisma/migrations` برای SQL نامرتب |
| **بازگشت سرویس** | ۱) هرگز `prisma migrate reset` در production. ۲) rollback کد به نسخه سازگار. ۳) migration ناقص را در branch fix و migration جدید (immutable) بسازید؛ migration قدیمی را ویرایش نکنید. ۴) در صورت lock/DDL blocker، session blocker را شناسایی و با تأیید DBA terminate کنید. ۵) از backup معتبر restore کنید و reconcile داده‌ها با backup دوم. |
| **اقدام پیشگیرانه** | backup و restore drill قبل از deploy؛ `db:migrate:drift` در CI؛ migrate روی کپی staging؛ rollback criteria مستند در release-runbook. |

---

## ۴. افشا/Compromise نشست

| بخش | توضیح |
|---|---|
| **Owner** | Security / Tech Lead |
| **نشانه‌ها** | استفاده هم‌زمان یک session token از چند IP/UA؛ افزایش `invalidSession`/reused؛ لاگ‌های ورود غیرعادی؛ گزارش کاربر |
| **Impact** | دسترسی غیرمجاز به حساب‌های کاربر/مدیر |
| **تشخیص** | `GET /api/app/v1/me/sessions` (کاربر) و session‌های مدیر؛ بررسی audit-log و metrics auth؛ شناسایی realm و scope |
| **بازگشت سرویس** | ۱) revoke همه session‌های affected. ۲) اگر مدیر است: revoke، reset رمز، بررسی permission/role و overrideهای اخیر. ۳) rotatet کردن `TOKEN_HASH_SECRET` (تنظیم `TOKEN_HASH_SECRET_PREVIOUS` و سپس جابه‌جایی — رجوع به crypto). ۴) اطلاع‌رسانی به مالک حساب. |
| **اقدام پیشگیرانه** | session rotation (موجود)؛ monitor reuse؛ alert روی دستگاه جدید مدیر؛ short-lived session برای مدیر. |

---

## ۵. سوءظن به Privilege Escalation

| بخش | توضیح |
|---|---|
| **Owner** | Security / Tech Lead |
| **نشانه‌ها** | اقدام مدیری خارج از permission خود؛ تغییر role/override غیرمجاز؛ افزایش `403`/`permission_denied`؛ گزارش داخلی |
| **Impact** | افشای داده‌ها یا تغییر تنظیمات حیاتی |
| **تشخیص** | بررسی `audit_logs` برای actionهای مدیریتی؛ بررسی `admin_role_assignments` و `admin_permission_overrides` اخیر؛ تست permission matrix با تست‌های `permission-evaluator` |
| **بازگشت سرویس** | ۱) suspend کردن ادمین مشکوک (`status`). ۲) revoke role/override. ۳) بازبینی همه actionهای وی در بازه زمانی. ۴) در صورت تأیید، واگردانی تغییرات (مثلاً refund/کاتالوگ). |
| **اقدام پیشگیرانه** | RBAC با least privilege؛ دو مرحله‌ای‌سازی actionهای حساس؛ alert روی اولین استفاده از permission پرمخاطره؛ `rbac-expiry` برای assignment منقضی. |

---

## ۶. انباشت صف اعلان (Notification Backlog)

| بخش | توضیح |
|---|---|
| **Owner** | SRE / تیم اعلان |
| **نشانه‌ها** | رشد `notification_deliveries` در state `pending`؛ latency بالا؛ alert `queue_backlog`؛ تاخیر در اطلاع‌رسانی درخواست‌ها |
| **Impact** | تأخیر در اطلاع‌رسانی قبول/رد درخواست؛ تجربه کاربری ضعیف |
| **تشخیص** | metrics `notification_*`؛ `GET /api/admins/v1/jobs/dead-letters/notifications`؛ بررسی نرخ مصرف worker و rate limit هر channel |
| **بازگشت سرویس** | ۱) scale worker (افزایش تکرار cron یا worker جدا). ۲) اگر channel خاصی blocked است: queue را برای آن channel نگه‌دارید و بقیه را جلو ببرید. ۳) dead-letter را با احتیاط replay کنید. |
| **اقدام پیشگیرانه** | alert threshold روی backlog؛ batch محدود به ازای worker؛ idempotency per channel؛ نگهداری log از template failureها. |

---

## اصل کلی پس از هر رخداد

- post-incident در جلسه‌ای با owner مستند شود (timeline، root cause، اقدام، prevention).
- رخدادهای security بدون افشای جزئیات حساس ثبت شوند.
- هر تغییر تنظیمات/داده در production با `audit_logs` ثبت شده باشد.
