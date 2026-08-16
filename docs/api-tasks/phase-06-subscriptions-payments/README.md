# فاز ۰۶ — اشتراک، پرداخت و Refund

> **هدف:** eligibility خدمات‌دهنده برای جستجو و جریان مالی قابل پیگیری.  
> **وابستگی:** فاز ۰۵  
> **جداول:** `subscription_plans`, `provider_subscriptions`, `subscription_payments`, `payment_refunds`

## مراحل

### ۰۶.۰۱ — مشاهده پلن و اشتراک

- [x] پلن‌های active و مرتب‌شده
- [x] اشتراک فعال با محاسبه زمان باقی‌مانده
- [x] تاریخچه cursor-paginated
- [x] job انقضا برای statusهای active پایان‌یافته

### ۰۶.۰۲ — شروع خرید

- [x] validate provider profile و plan
- [x] ساخت subscription pending با snapshot پلن
- [x] ساخت payment initiated در یک transaction
- [x] idempotency key برای جلوگیری از خرید تکراری
- [x] دریافت authority از gateway بعد از commit یا در workflow مقاوم

### ۰۶.۰۳ — callback و verify

- [x] verify signature/authority/amount
- [x] replay-safe و idempotent
- [x] paid کردن payment و active کردن subscription در transaction
- [x] جلوگیری از دو اشتراک active با constraint
- [x] تعیین policy تمدید: شروع بعد از پایان فعلی یا جایگزینی کنترل‌شده

### ۰۶.۰۴ — failure و reconciliation

- [x] ثبت failure code/message امن
- [x] reconciliation job برای pendingهای طولانی
- [x] webhook retry و dead-letter
- [x] عدم اعتماد به redirect سمت Client به‌تنهایی

### ۰۶.۰۵ — عملیات مالی مدیریت

- [x] grant اشتراک با permission و audit
- [x] cancel اشتراک با reason
- [x] refund کامل/جزئی با کنترل سقف مبلغ باقیمانده
- [x] state machine refund و reconciliation

## تست‌های الزامی

- [x] callback تکراری
- [x] amount mismatch و signature نامعتبر
- [x] concurrent activation
- [x] refund بیشتر از مبلغ پرداخت‌شده
- [x] provider بدون پروفایل

## معیار پذیرش

- [x] فقط اشتراک active و معتبر search eligibility می‌دهد.
- [x] وضعیت پرداخت و اشتراک در failure نیمه‌کاره ناسازگار نمی‌ماند.
- [x] عملیات admin مالی audit و idempotency دارند.
