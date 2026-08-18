# فاز ۱۰ — API کامل سیستم مدیریت

> **هدف:** پوشش تمام عملیات داخلی با RBAC، audit و کنترل تغییرات حساس.  
> **وابستگی:** فاز ۰۴ + ۰۹  
> **وضعیت:** ✅ تکمیل شده

## مراحل

### ۱۰.۰۱ — Dashboard

- [x] KPI کاربران، Providerها، Requestها، درآمد اشتراک و failureها
- [x] queryهای aggregate بهینه و cache کوتاه
- [x] date range و timezone مشخص

### ۱۰.۰۲ — کاربران و Moderation

- [x] list/detail/filter/search
- [x] update فیلدهای مجاز
- [x] activate/deactivate/suspend/ban/unban/warning با reason
- [x] revoke session پس از ban/deactivate
- [x] timeline moderation و audit

### ۱۰.۰۳ — Providerها

- [x] detail شامل profile، work area، services و subscription
- [x] approve/deactivate/availability
- [x] ویرایش قیمت با price history actor admin
- [x] جلوگیری از دور زدن قواعد subscription/search

### ۱۰.۰۴ — کاتالوگ

- [x] CRUD/soft-delete category و service
- [x] slug uniqueness و reorder
- [x] منع حذف مخرب رکورد دارای تاریخچه
- [x] invalidation cache اپ

### ۱۰.۰۵ — Request intervention

- [x] list/detail/history
- [x] cancel با Permission و reason
- [x] remove link Provider طبق state
- [x] عدم rewrite تاریخچه؛ فقط action جبرانی و history جدید

### ۱۰.۰۶ — اشتراک، پرداخت و Refund

- [x] مدیریت plan
- [x] grant/cancel subscription
- [x] مشاهده payment و refund workflow
- [x] export با مجوز جدا

### ۱۰.۰۷ — مدیران و RBAC

- [x] CRUD امن admin
- [x] status/password reset کنترل‌شده
- [x] CRUD role و assignment
- [x] permission override allow/deny
- [x] حفاظت از system role و آخرین super-admin

### ۱۰.۰۸ — Settings و Audit

- [x] settings با type validation و public allow-list
- [x] audit list/detail با فیلتر actor/module/action/date
- [x] عدم امکان ویرایش audit log

## معیار پذیرش

- [x] هر action به Permission کاتالوگ‌شده نگاشت شده است.
- [x] تمام mutationهای حساس audit دارند.
- [x] listها pagination و محدودیت فیلتر دارند.
- [x] admin نمی‌تواند با direct object reference از Permission عبور کند.
