# فاز ۰۸ — چرخه کامل درخواست خدمت

> **هدف:** پیاده‌سازی مهم‌ترین منطق پلتفرم با تراکنش و concurrency ایمن.  
> **وابستگی:** فاز ۰۷  
> **جداول:** پنج جدول lifecycle درخواست + notifications  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۰۸.۰۱ — ایجاد Request و ارسال

- [x] `POST /service-requests` با idempotency
- [x] snapshot کاربر، خدمت، category و زمین
- [x] درج حداقل یک date
- [x] درج initial status history
- [x] درج linkهای Provider با snapshot قیمت/فاصله
- [x] اعلان `request_new`

### ۰۸.۰۲ — inbox و جزئیات

- [x] لیست Consumer با status/tab
- [x] لیست Provider براساس relation link و assigned profile
- [x] ثبت viewed_at idempotent
- [x] responseهای actor-aware
- [x] تماس فقط در `in_progress` و `completed`

### ۰۸.۰۳ — قبول Provider

- [x] transaction و lock Request
- [x] verify status pending و link status sent
- [x] update assigned provider، price snapshot، acceptedAt و version
- [x] accepted کردن یک link و removed کردن سایر linkها
- [x] history و notification در همان transaction
- [x] تبدیل race بازنده به conflict استاندارد

### ۰۸.۰۴ — رد Provider

- [x] فقط link همان Provider از sent به rejected
- [x] parent Request pending بماند.
- [x] rejection reason اختیاری/محدود
- [x] provider history و notification Consumer

### ۰۸.۰۵ — لغو

- [x] pending فقط توسط Consumer و دلیل اختیاری
- [x] in-progress توسط Consumer/assigned Provider با دلیل اجباری
- [x] admin cancel در route جدا و permissionدار
- [x] تمام timestampها، actorها، histories و link removalها atomic

### ۰۸.۰۶ — پایان کار

- [x] فقط owner Consumer
- [x] فقط از `in_progress`
- [x] completedAt و version
- [x] history و اعلان
- [x] immutable شدن مبلغ توافق‌شده برای گزارش

## سند تخصصی

- [x] [تراکنش‌ها و ماشین وضعیت](./transaction-state-machine.md)

## معیار پذیرش

- [x] BR-01 تا BR-09 با integration و concurrency test پوشش دارند.
- [x] هیچ transition غیرمجاز یا double accept ممکن نیست.
- [x] contact privacy در serializer مرکزی enforce می‌شود.
- [x] تاریخچه‌ها با رکورد نهایی سازگار هستند.
