# Architecture Decision Records

این پوشه تصمیم‌های قطعی معماری Backend را نگهداری می‌کند. هر تصمیم جدید با شماره ترتیبی ثبت می‌شود و تغییر تصمیم قبلی فقط با ADR جایگزین انجام می‌شود.

| ADR | عنوان | وضعیت |
|---|---|---|
| [0001](./0001-layered-nextjs-backend.md) | معماری لایه‌ای Backend در Next.js | Accepted |
| [0002](./0002-http-api-contract.md) | قرارداد HTTP، خطا، pagination و concurrency | Accepted |
| [0003](./0003-identity-session-security.md) | جداسازی هویت، نشست و credentialها | Accepted |
| [0004](./0004-data-representation-history.md) | نمایش داده، شناسه عمومی و snapshot تاریخی | Accepted |
| [0005](./0005-openapi-contract-governance.md) | حاکمیت OpenAPI و تولید Client | Accepted |
| [0006](./0006-initial-api-threat-model.md) | Threat model اولیه دو قلمرو API | Accepted |

## قواعد

- ADR پذیرفته‌شده ویرایش ماهوی نمی‌شود؛ تصمیم جایگزین با ADR جدید ثبت می‌شود.
- Route Handler، Service، Repository و قرارداد عمومی باید با این تصمیم‌ها سازگار باشند.
- `docs/openapi/openapi.json` قرارداد ماشین‌خوان مرجع است.
- قواعد امنیتی تکمیلی در `docs/api-tasks/security-baseline.md` الزام‌آور باقی می‌مانند.
