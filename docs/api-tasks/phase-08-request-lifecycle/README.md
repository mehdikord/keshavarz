# فاز ۰۸ — چرخه کامل درخواست خدمت

> **هدف:** پیاده‌سازی مهم‌ترین منطق پلتفرم با تراکنش و concurrency ایمن.  
> **وابستگی:** فاز ۰۷  
> **جداول:** پنج جدول lifecycle درخواست + notifications

## مراحل

### ۰۸.۰۱ — ایجاد Request و ارسال

- [ ] `POST /service-requests` با idempotency
- [ ] snapshot کاربر، خدمت، category و زمین
- [ ] درج حداقل یک date
- [ ] درج initial status history
- [ ] درج linkهای Provider با snapshot قیمت/فاصله
- [ ] اعلان `request_new`

### ۰۸.۰۲ — inbox و جزئیات

- [ ] لیست Consumer با status/tab
- [ ] لیست Provider براساس relation link و assigned profile
- [ ] ثبت viewed_at idempotent
- [ ] responseهای actor-aware
- [ ] تماس فقط در `in_progress` و `completed`

### ۰۸.۰۳ — قبول Provider

- [ ] transaction و lock Request
- [ ] verify status pending و link status sent
- [ ] update assigned provider، price snapshot، acceptedAt و version
- [ ] accepted کردن یک link و removed کردن سایر linkها
- [ ] history و notification در همان transaction
- [ ] تبدیل race بازنده به conflict استاندارد

### ۰۸.۰۴ — رد Provider

- [ ] فقط link همان Provider از sent به rejected
- [ ] parent Request pending بماند.
- [ ] rejection reason اختیاری/محدود
- [ ] provider history و notification Consumer

### ۰۸.۰۵ — لغو

- [ ] pending فقط توسط Consumer و دلیل اختیاری
- [ ] in-progress توسط Consumer/assigned Provider با دلیل اجباری
- [ ] admin cancel در route جدا و permissionدار
- [ ] تمام timestampها، actorها، histories و link removalها atomic

### ۰۸.۰۶ — پایان کار

- [ ] فقط owner Consumer
- [ ] فقط از `in_progress`
- [ ] completedAt و version
- [ ] history و اعلان
- [ ] immutable شدن مبلغ توافق‌شده برای گزارش

## سند تخصصی

- [تراکنش‌ها و ماشین وضعیت](./transaction-state-machine.md)

## معیار پذیرش

- [ ] BR-01 تا BR-09 با integration و concurrency test پوشش دارند.
- [ ] هیچ transition غیرمجاز یا double accept ممکن نیست.
- [ ] contact privacy در serializer مرکزی enforce می‌شود.
- [ ] تاریخچه‌ها با رکورد نهایی سازگار هستند.
