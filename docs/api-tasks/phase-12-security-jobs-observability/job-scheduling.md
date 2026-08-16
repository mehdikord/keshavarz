# زمان‌بندی و قابلیت اطمینان Jobها

> مرجع اجرای دستی/زمان‌بندی jobهای پلتفرم و سازوکار lease.

## اجرای دستی

```bash
pnpm jobs:run                # همه jobها
pnpm jobs:run app-auth-cleanup
pnpm jobs:run subscription-expiration payment-reconciliation
```

از REST نیز از طریق `POST /api/admins/v1/jobs/run` (با session مدیر و permission مربوط) قابل اجراست.

## سازوکار Lease

هر job پیش از اجرا یک lease روی جدول `job_runs` می‌گیرد:

- یک ردیف یکتا (`uq_job_runs_name`) با `status=running` و `lease_expires_at`.
- اگر ردیف فعال با `lease_expires_at` در آینده متعلق به runner دیگری باشد، job **skip** می‌شود (جلوگیری از اجرای هم‌زمان).
- اگر lease منقضی باشد (کراش runner قبلی)، lease با `run_id` جدید تصاحب می‌شود.
- پس از پایان، ردیف به `completed`/`failed` با `duration_ms` و پیام خطا (بدون اطلاعات حساس) به‌روزرسانی می‌شود.
- انتشار lease فقط با تطبیق `job_name` و `run_id` انجام می‌شود تا ردیف تصاحب‌شده overwrite نشود.

پیش‌فرض `leaseExpiresAt = now + 10 دقیقه`. برای jobهای سنگین‌تر مقدار را در صورت نیاز بزرگ‌تر کنید.

## زمان‌بندی cron (پیشنهادی)

در محیط‌های بدون scheduler داخلی، cron زیر را روی یک worker واحد ست کنید (lease از اجرای هم‌زمان جلوگیری می‌کند):

```cron
# هر ۵ دقیقه — پاک‌سازی OTP/نشست منقضی، منقضی‌کردن اشتراک و بازکشی پرداخت
*/5 * * * * cd /srv/keshavarz/next && pnpm jobs:run app-auth-cleanup subscription-expiration payment-reconciliation

# هر دقیقه — پردازش صف اعلان‌ها
* * * * * cd /srv/keshavarz/next && pnpm jobs:run notification-deliveries

# ساعتی — درنظر گرفتن role/override منقضی و پاک‌سازی export قدیمی
0 * * * * cd /srv/keshavarz/next && pnpm jobs:run rbac-expiry export-cleanup

# هر ۱۵ دقیقه — drain dead-letter پرداخت (با احتیاط و نظارت)
*/15 * * * * cd /srv/keshavarz/next && pnpm jobs:run payment-dead-letter-drain
```

نکات:

- jobها idempotent هستند و اجرای تکراری عوارضی ندارد.
- `scripts/run-jobs.mts` از SIGINT/SIGTERM پشتیبانی می‌کند و در shutdown اتصال DB را می‌بندد.
- در اجرای چند نمونه، باید `HOSTNAME` متمایز باشد تا `lease_owner` مشخص شود.
