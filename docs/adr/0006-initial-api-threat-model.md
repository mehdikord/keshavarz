# ADR-0006: Threat Model اولیه API

- **وضعیت:** Accepted
- **تاریخ:** 2026-08-03
- **روش:** STRIDE، با تمرکز بر trust boundaryهای App User، Admin، Payment Gateway، SMS Provider و Database

## دارایی‌های حساس

- session token و CSRF token هر realm
- OTP، password hash و reset token
- شماره موبایل و مختصات زمین/Provider
- permission، override و audit log مدیر
- مبلغ، callback و وضعیت پرداخت/اشتراک
- snapshot و transitionهای درخواست

## مرزهای اعتماد

1. Client عمومی تا `/api/app/v1`
2. پنل مدیریت تا `/api/admins/v1`
3. API تا MySQL/Prisma
4. API تا SMS Provider
5. Payment Gateway تا callback عمومی امضاشده
6. Worker/Job تا queue و delivery provider

## تهدیدها و کنترل‌ها

| تهدید | سناریو | کنترل الزامی |
|---|---|---|
| Spoofing | استفاده session اپ در API مدیر | cookie، path، session table و guard مستقل |
| Spoofing | brute force OTP/password | expiry، attempts، cooldown، lockout و rate limit ترکیبی |
| Tampering | تغییر payload با Idempotency-Key قبلی | payload hash و `409 IDEMPOTENCY_KEY_REUSED` |
| Tampering | transition هم‌زمان request | transaction، version/lock و constraint |
| Repudiation | تغییر حساس مدیر بدون ردپا | `admin_audit_logs` append-only با requestId و actor |
| Information Disclosure | IDOR یا افشای BIGINT/phone/location | query scoped، DTO allow-list و contact privacy |
| Information Disclosure | error/log حاوی secret | redaction، پیام عمومی و منع stack/SQL در response |
| Denial of Service | OTP، search، export یا upload پرهزینه | rate limit، body limit، pagination و async export |
| Elevation of Privilege | override یا role اشتباه | deny-by-default، deny precedence، expiry و audit |
| CSRF | mutation با cookie | CSRF token، Origin/Referer و SameSite |
| Replay | refresh token یا callback تکراری | rotation/reuse detection، signature، timestamp و idempotency |
| Supply Chain | dependency یا migration مخرب | lockfile، scan، review SQL و deployment gate |

## الزامات تست آینده

- session fixation، rotation reuse و cross-realm credential
- IDOR برای تمام pathهای دارای identifier
- CSRF و Origin spoofing برای mutationها
- brute force و enumeration برای OTP/admin login
- privilege escalation برای role/override منقضی و deny
- replay و signature invalid برای payment callback
- race روی accept/cancel/complete و idempotency هم‌زمان

## ریسک باقیمانده

- پارامتر نهایی rate limit و Argon2id باید با ظرفیت production benchmark شود.
- retention log و data deletion در فاز عملیات نهایی می‌شود.
- انتخاب vendor پیامک، درگاه، storage و queue کنترل‌های اختصاصی جدید نیاز دارد.
