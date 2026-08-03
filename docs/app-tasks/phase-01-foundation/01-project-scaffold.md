# ۱.۰۱ — Project Scaffold

> **فاز:** ۱ · زیرساخت  
> **اولویت:** P0  
> **پیش‌نیاز:** فاز ۰

---

## هدف

ایجاد پروژه Next.js 16 در پوشه `next/` با تمام وابستگی‌های لازم.

---

## تسک‌ها

### ۱. ایجاد پروژه

- [ ] `cd /home/cloner/Projects/keshavarz`
- [ ] `pnpm create next-app@16.2.0 next --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- [ ] تأیید نسخه‌ها در `package.json`:
  - next: 16.2.0
  - react: 19.2.3
  - react-dom: 19.2.3
  - typescript: 5.9.3

### ۲. نصب وابستگی‌ها

```bash
cd next
pnpm add zustand@5.0.9 zod@4.2.1
pnpm add lucide-react class-variance-authority clsx tailwind-merge
pnpm add sonner
pnpm add recharts
pnpm add @hookform/resolvers react-hook-form
pnpm add -D eslint@9.39.2
```

### ۳. راه‌اندازی shadcn/ui 3.6.2

- [ ] `pnpm dlx shadcn@3.6.2 init`
- [ ] style: new-york (یا default) + RTL-compatible
- [ ] baseColor: green (نزدیک primary)
- [ ] cssVariables: true

### ۴. ساختار پوشه اولیه

```
next/src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── shared/
│   ├── providers-panel/   # UI پنل /providers
│   ├── users-panel/       # UI پنل /users
│   └── providers/         # React context (AppProvider)
├── lib/
│   ├── utils.ts
│   ├── mock/
│   └── validators/
├── stores/
├── types/
└── hooks/
```

### ۵. TypeScript strict

- [ ] `strict: true`
- [ ] `noUncheckedIndexedAccess: true`
- [ ] path alias `@/*` → `./src/*`

### ۶. ESLint

- [ ] پیکربندی flat config طبق `docs/Best Practices/ESLint.md`
- [ ] `pnpm lint` بدون خطا

### ۷. اسکریپت‌های package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  }
}
```

---

## فایل‌های خروجی

| فایل | توضیح |
|------|--------|
| `next/package.json` | وابستگی‌ها |
| `next/tsconfig.json` | strict config |
| `next/src/lib/utils.ts` | `cn()` helper |
| `next/components.json` | shadcn config |

---

## معیار پذیرش

- [ ] `pnpm dev` اجرا می‌شود
- [ ] `pnpm build` موفق
- [ ] صفحه پیش‌فرض Next.js نمایش داده می‌شود

---

## نکات

- مدیریت پکیج: **فقط pnpm**
- Node.js: 20.9+
