# کشاورز

نسخه Mock پلتفرم خدمات کشاورزی با Next.js، React، Tailwind CSS، Zustand و Zod.

## اجرا

```bash
pnpm install
pnpm dev
```

سپس آدرس `http://localhost:3000` را باز کنید.

## احراز هویت Mock

- کد OTP برای تمام شماره‌های معتبر: `12345`
- شماره خدمات‌گیرنده دمو: `09123456789`
- شماره خدمات‌دهنده دمو: `09121111111`

## نقشه

نقشه عمومی پروژه با Leaflet و سرویس [پارسی‌مپ](https://docs.parsimap.ir/) پیاده‌سازی شده است.

- تنظیمات لایه‌ها (ماهواره‌ای و نقشه خیابانی): `src/lib/maps/parsimap.ts`
- کامپوننت عمومی نقشه: `src/components/shared/parsimap-map.tsx`
- انتخابگر موقعیت (پین ثابت وسط نقشه، GPS و حالت تمام‌صفحه): `src/components/shared/map-picker.tsx`
- لایه پیش‌فرض: تصویر ماهواره‌ای پارسی‌مپ
- توکن نقشه (PMI_MAP_TOKEN) در متغیر `NEXT_PUBLIC_PARSIMAP_MAP_TOKEN` قرار می‌گیرد و پس از تغییر آن باید سرور dev را دوباره اجرا کنید.
- طبق شرایط پارسی‌مپ، attribution گوشه پایین نقشه نباید حذف یا تغییر داده شود.

برای نمایش صرفاً خواندنی از `interactive={false}` و برای انتخاب موقعیت از `onChange` استفاده کنید.

## بررسی کیفیت

```bash
pnpm lint
pnpm build
```
