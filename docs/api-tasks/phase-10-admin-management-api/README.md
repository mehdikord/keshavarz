# فاز ۱۰ — API کامل سیستم مدیریت

> **هدف:** پوشش تمام عملیات داخلی با RBAC، audit و کنترل تغییرات حساس.  
> **وابستگی:** فاز ۰۴ + ۰۹

## مراحل

### ۱۰.۰۱ — Dashboard

- [ ] KPI کاربران، Providerها، Requestها، درآمد اشتراک و failureها
- [ ] queryهای aggregate بهینه و cache کوتاه
- [ ] date range و timezone مشخص

### ۱۰.۰۲ — کاربران و Moderation

- [ ] list/detail/filter/search
- [ ] update فیلدهای مجاز
- [ ] activate/deactivate/suspend/ban/unban/warning با reason
- [ ] revoke session پس از ban/deactivate
- [ ] timeline moderation و audit

### ۱۰.۰۳ — Providerها

- [ ] detail شامل profile، work area، services و subscription
- [ ] approve/deactivate/availability
- [ ] ویرایش قیمت با price history actor admin
- [ ] جلوگیری از دور زدن قواعد subscription/search

### ۱۰.۰۴ — کاتالوگ

- [ ] CRUD/soft-delete category و service
- [ ] slug uniqueness و reorder
- [ ] منع حذف مخرب رکورد دارای تاریخچه
- [ ] invalidation cache اپ

### ۱۰.۰۵ — Request intervention

- [ ] list/detail/history
- [ ] cancel با Permission و reason
- [ ] remove link Provider طبق state
- [ ] عدم rewrite تاریخچه؛ فقط action جبرانی و history جدید

### ۱۰.۰۶ — اشتراک، پرداخت و Refund

- [ ] مدیریت plan
- [ ] grant/cancel subscription
- [ ] مشاهده payment و refund workflow
- [ ] export با مجوز جدا

### ۱۰.۰۷ — مدیران و RBAC

- [ ] CRUD امن admin
- [ ] status/password reset کنترل‌شده
- [ ] CRUD role و assignment
- [ ] permission override allow/deny
- [ ] حفاظت از system role و آخرین super-admin

### ۱۰.۰۸ — Settings و Audit

- [ ] settings با type validation و public allow-list
- [ ] audit list/detail با فیلتر actor/module/action/date
- [ ] عدم امکان ویرایش audit log

## معیار پذیرش

- [ ] هر action به Permission کاتالوگ‌شده نگاشت شده است.
- [ ] تمام mutationهای حساس audit دارند.
- [ ] listها pagination و محدودیت فیلتر دارند.
- [ ] admin نمی‌تواند با direct object reference از Permission عبور کند.
