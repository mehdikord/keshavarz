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

نقشه عمومی پروژه با Leaflet و سرویس MeMaps پیاده‌سازی شده است.

- تنظیمات و URL لایه‌ها: `src/lib/maps/memaps.ts`
- کامپوننت عمومی نقشه: `src/components/shared/memaps-map.tsx`
- انتخابگر موقعیت با GPS و انتخاب روی نقشه: `src/components/shared/map-picker.tsx`
- لایه پیش‌فرض: تصویر ماهواره‌ای Google Earth از طریق MeMaps
- استفاده از سرویس فعلی نیاز به API Key ندارد.

برای نمایش صرفاً خواندنی از `interactive={false}` و برای انتخاب موقعیت از `onChange` استفاده کنید.

## بررسی کیفیت

```bash
pnpm lint
pnpm build
```
