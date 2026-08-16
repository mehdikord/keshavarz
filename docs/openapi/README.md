# OpenAPI Contract

- فایل مرجع: `openapi.json`
- نسخه: OpenAPI 3.1
- inventory مبنا: `docs/api-tasks/endpoint-catalog.md`
- اعتبارسنجی: از پوشه `next` دستور `pnpm check:api-contracts`

## تولید Client و Mock

ابزار انتخابی باید OpenAPI 3.1 و operationId را پشتیبانی کند. نام متد generated client از operationId گرفته می‌شود و نباید به path خام وابسته باشد.

نمونه با ابزار دلخواه:

```bash
openapi-generator-cli generate \
  -i ../docs/openapi/openapi.json \
  -g typescript-fetch \
  -o .generated/api-client
```

دایرکتوری generated تا فاز انتشار source of truth نیست. ابتدا spec تغییر می‌کند، validator اجرا می‌شود و سپس Client دوباره تولید می‌شود.

## سطح Skeleton

- تمام endpointها، realm، auth scheme، tag و operationId ثبت شده‌اند.
- envelope، خطا، pagination، شناسه، زمان، پول و Decimal قرارداد مشترک دارند.
- schema دقیق body و DTO هر feature در فاز مالک آن endpoint تکمیل می‌شود.
- `GenericData` فقط placeholder فاز صفر است و پیش از نهایی‌شدن هر endpoint باید جایگزین شود.

## اسناد همراه

- [نگاشت دامنه و دیتابیس](./domain-mapping.md)
- [ADRهای معماری](../adr/)
- [خط‌مشی امنیت](../api-tasks/security-baseline.md)
