# فاز ۰۵ — مدیریت کاتالوگ

> **هدف:** CRUD حرفه‌ای دسته‌ها و خدمات + reorder، هم‌راستا با API مدیریت کاتالوگ.  
> **خط:** A  
> **وابستگی:** فاز ۰۲  
> **Permission:** `catalog.view` / `catalog.manage`  
> **وضعیت:** انجام‌شده

## مراحل

### ۰۵.۰۱ — Categories

- [x] لیست دسته‌ها با وضعیت فعال
- [x] ایجاد / ویرایش / soft-delete یا deactivate مطابق API
- [x] اعتبارسنجی slug و نام در فرم (Zod)

### ۰۵.۰۲ — Services

- [x] لیست خدمات با فیلتر دسته/وضعیت
- [x] ایجاد / ویرایش / حذف امن
- [x] جلوگیری از حذف مخرب در UI وقتی API 409 می‌دهد؛ پیام واضح

### ۰۵.۰۳ — Reorder

- [x] UI مرتب‌سازی (drag-and-drop یا up/down)
- [x] `POST /catalog/reorder`
- [x] به‌روزرسانی فوری لیست پس از موفقیت

### ۰۵.۰۴ — همگام‌سازی با اپ

- [x] پس از تغییر کاتالوگ، رفتار cache اپ در نظر گرفته شود (حداقل مستند؛ invalidation سمت سرور است)
- [x] نمایش اینکه تغییرات در `/users/search` و `/providers/services` بعد از مهاجرت اپ دیده می‌شوند

## معیار پذیرش

- [x] مدیر دارای مجوز می‌تواند دسته و خدمت را کامل مدیریت کند.
- [x] reorder پایدار است و ترتیب جدید از API خوانده می‌شود.
- [x] کاربر بدون `catalog.manage` فقط مشاهده دارد.
- [x] فرم‌ها field error سرور را نشان می‌دهند.

## فایل‌های کلیدی

- `next/src/lib/api/admin-catalog.ts`
- `next/src/components/admin-panel/catalog/*`
- `next/src/app/admins/(console)/catalog/**`

## یادداشت cache

Mutations کاتالوگ روی سرور `invalidateCatalogCache()` را صدا می‌زنند. UI ادمین لیست را بعد از هر ذخیره دوباره از API می‌خواند. نمایش در اپ کاربر (`/users/search`, `/providers/services`) پس از مهاجرت خط B به API واقعی برقرار می‌شود.

## گام بعدی

[فاز ۰۶ — Service Requests](../phase-06-service-requests/)
