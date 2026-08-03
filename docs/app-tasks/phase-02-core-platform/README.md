# فاز ۲ — هسته پلتفرم

> **هدف:** Types، Validators، Mock Stores، کامپوننت‌های مشترک و Auth.  
> **مدت تخمینی:** ۲–۳ روز  
> **وابستگی:** [فاز ۱](../phase-01-foundation/)

---

## مراحل این فاز

| # | مرحله | سند |
|---|--------|-----|
| ۱ | Types و Zod Validators | [01-types-validators.md](./01-types-validators.md) |
| ۲ | Mock Data و Zustand Stores | [02-mock-data-stores.md](./02-mock-data-stores.md) |
| ۳ | کامپوننت‌های مشترک UI | [03-shared-components.md](./03-shared-components.md) |
| ۴ | جریان احراز هویت Mock | [04-auth-flow.md](./04-auth-flow.md) |

---

## چک‌لیست فاز

- [ ] تمام interfaceهای PRD در `types/` تعریف شده
- [ ] Zod schemas برای فرم‌های اصلی
- [ ] ۵ store Zustand با persist
- [ ] Seed data بارگذاری اولیه
- [ ] کامپوننت‌های shared: PageHeader, EmptyState, StatCard, ...
- [ ] Auth: ورود OTP Mock + route guard
- [ ] Sonner toast پیکربندی شده

---

## ترتیب اجرا

```
01 → 02 → 03 → 04
```

> مرحله ۰۳ و ۰۴ می‌توانند بخشی موازی پیش بروند پس از ۰۱.

---

## معیار پذیرش

- ورود با شماره `09123456789` و OTP `12345` کار کند
- داده seed در localStorage persist شود
- route guard مسیرهای محافظت‌شده را به `/auth` هدایت کند

---

## گام بعدی (موازی ممکن)

- [فاز ۳: صفحات عمومی](../phase-03-landing-public/README.md)
- [فاز ۴: Provider](../phase-04-provider-panel/README.md)
- [فاز ۵: Consumer](../phase-05-consumer-panel/README.md)
