# ADR-0005: حاکمیت OpenAPI و Client

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03

## تصمیم

- `docs/openapi/openapi.json` قرارداد ماشین‌خوان مرجع با OpenAPI 3.1 است.
- تمام endpointهای `docs/api-tasks/endpoint-catalog.md` باید قبل از پیاده‌سازی در spec ثبت شوند.
- هر operation دارای operationId یکتا، tag، security، response موفق و خطاهای مشترک است.
- operationId از الگوی lowerCamelCase `realmDomainAction` استفاده می‌کند؛ تغییر آن breaking change برای Client تولیدشده است.
- schemaهای عمومی از `components` و `$ref` استفاده می‌کنند و schemaهای feature در فاز مالک تکمیل می‌شوند.
- generated client و generated mock commit نمی‌شوند مگر در فاز انتشار تصمیم دیگری ثبت شود.
- Client با generator سازگار با OpenAPI 3.1 و نام operationId تولید می‌شود.

## فرایند تغییر

1. تغییر catalog و spec در یک patch انجام می‌شود.
2. `pnpm check:api-contracts` parity، uniqueness، path parameterها، tag و security را بررسی می‌کند.
3. breaking change فقط در نسخه جدید URL یا با دوره deprecation مستند انجام می‌شود.
4. implementation، integration test و OpenAPI example در فاز feature هم‌زمان تکمیل می‌شوند.

## قرارداد Mock

- skeleton فعلی envelopeها، security schemeها، parameterهای مشترک و inventory کامل endpointها را ارائه می‌کند.
- DTOهای دامنه در فازهای 03 تا 11 جای placeholderهای `GenericData` را می‌گیرند.
- Frontend می‌تواند از response exampleهای مشترک mock server بسازد و سپس به‌تدریج schemaهای feature را مصرف کند.
