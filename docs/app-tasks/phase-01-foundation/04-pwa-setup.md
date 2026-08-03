# ۱.۰۴ — PWA Setup

> **فاز:** ۱ · زیرساخت  
> **اولویت:** P1  
> **پیش‌نیاز:** [01-project-scaffold](./01-project-scaffold.md)

---

## هدف

قابلیت نصب اپ روی موبایل (Add to Home Screen).

---

## تسک‌ها

### ۱. manifest.json

```json
{
  "name": "کشاورز",
  "short_name": "کشاورز",
  "description": "پلتفرم خدمات کشاورزی",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F8FAF5",
  "theme_color": "#2D6A4F",
  "orientation": "portrait",
  "lang": "fa",
  "dir": "rtl",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### ۲. آیکون‌ها

- [ ] طراحی آیکون ساده: برگ + گندم یا تراکتور خطی
- [ ] سایزها: ۱۹۲, ۵۱۲, apple-touch-icon ۱۸۰

### ۳. Meta tags در layout

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2D6A4F" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### ۴. Service Worker (Mock)

- [ ] استفاده از `@serwist/next` یا `next-pwa` (سازگار با Next 16)
- [ ] کش استاتیک assets
- [ ] در Mock: offline fallback ساده (اختیاری)

### ۵. viewport

```tsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

---

## فایل‌های خروجی

| فایل |
|------|
| `public/manifest.json` |
| `public/icons/icon-192.png` |
| `public/icons/icon-512.png` |

---

## معیار پذیرش

- [ ] Chrome DevTools → Application → Manifest معتبر
- [ ] «Install app» در دسکتاپ/موبایل نمایش داده شود
