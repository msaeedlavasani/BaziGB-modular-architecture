# BaziGB — HANDOFF (تحویل و ادامه کار)

## وضعیت فعلی

- **Baseline تولید:** `main`
- **Working branch فعال برای اصلاح Foundation:** `refactor/platform-foundation-i18n-v3`
- **Governance source:** آخرین نسخه تاییدشده روی `ai/autonomous-development-system-v1`
- **Production:** این branch هنوز merge یا deploy نشده است.
- **هدف جاری:** تثبیت Platform Foundation پیش از ادامه باگ‌فیکس‌های عمومی و اضافه‌کردن بازی‌های پیچیده مانند Catan.

> نکته: توضیح قدیمی «توسعه و تولید فقط روی main» دیگر مدل کاری این refactor نیست. `main` باید در طول کار پایدار بماند و اصلاحات ابتدا روی branch مستقل انجام و اعتبارسنجی شوند.

## Taskهای جاری

### Task 0 — Baseline & Governance Check
**Status: IN PROGRESS**

- کار از `main` جدا شده است.
- هیچ deployای مجاز یا انجام‌شده نیست.
- governance جاری باید قبل از تصمیم‌های اجرایی مرجع باشد، نه حافظه سشن‌های قبلی.

### Task 1 — Persian / English Architecture
**Status: IN PROGRESS**

مدل هدف:

```text
shared components
shared business logic
shared game engine
shared realtime/server contracts
        +
locale content
RTL / LTR
localized typography
localized metadata
localized routes
```

تغییرات Foundation انجام‌شده روی branch:

- locale config تایپ‌شده برای `fa` و `en` اضافه شده است.
- theme از RTL/font ثابت به `createBaziGBTheme({ direction, fontFamily })` تبدیل شده، با حفظ رفتار پیش‌فرض فارسی.
- Providers قابلیت دریافت direction/font فعال را دارد.
- root layout زبان، direction، metadata و theme input را از locale configuration می‌گیرد.
- Header دارای shell messageهای locale-aware شده است.
- routeهای فعلی هنوز locale-neutral هستند؛ `/fa/...` و `/en/...` عمداً تا زمان migration اتمیک فعال نشده‌اند.

### Task 2 — Platform Architecture Audit
**Status: IN PROGRESS**

یافته‌های مهم تا این مرحله:

- Lobby و بخش‌هایی از UI متن فارسی/انگلیسی مخلوط دارند.
- Footer/Site Settings هنوز مدل محتوای locale-aware تاییدشده ندارد.
- metadata نمایشی بازی‌ها بین مسیر bot/local و multiplayer تکرار شده است.
- user-facing copy در game pages هنوز page-local و فارسی‌محور است.

### Task 3 — Component Inventory
**Status: IN PROGRESS**

وضعیت اولیه:

- `GameShell` مصرف واقعی در هر دو مسیر local/bot و multiplayer دارد و canonical candidate قوی است.
- `GameCard` وجود دارد ولی Lobby کارت انتخاب بازی را inline رندر می‌کند؛ canonicality باید تعیین شود.
- `EmptyState`، `LoadingSkeleton`، `Modal` و `Dice3D` هنوز نیازمند consumer-level verification هستند.
- هیچ shared component صرفاً به دلیل unused به‌نظررسیدن حذف نمی‌شود.

## Component Graveyard Policy

قبل از حذف یا ساخت abstraction جدید:

1. وجود component بررسی شود.
2. implementation خوانده شود.
3. تمام consumerهای جاری بررسی شوند.
4. inline/duplicate implementationها مقایسه شوند.
5. یک canonical implementation انتخاب شود.
6. consumerها migrate شوند.
7. duplicate/dead code فقط بعد از validation حذف شود.

Classification:

- `CANONICAL`
- `DUPLICATE`
- `INLINE_DUPLICATE`
- `UNUSED_CANDIDATE`
- `GAME_SPECIFIC`
- `NEEDS_SPLIT`
- `NEEDS_MERGE`

## Bug / Debt Ledger Summary

جزئیات کامل در `docs/platform-foundation.md` نگهداری می‌شود.

موارد فعال مهم:

- `DEBT-001` — locale قبلاً global/hard-coded بود؛ partially mitigated.
- `DEBT-002` — mixed-language Lobby copy.
- `DEBT-003` — `GameCard` canonicality mismatch / component graveyard risk.
- `DEBT-004` — direction/font coupling به singleton theme؛ foundation mitigated.
- `DEBT-005` — Footer content model locale-aware نیست.
- `DEBT-006` — duplicate game presentation metadata.
- `DEBT-007` — locale-aware labels قبل از locale-aware route links؛ English نباید زودتر expose شود.
- `DEBT-008` — hard-coded user-facing Persian copy در game pages.

Bug/debtهای جدید در طول کار باید همان مرحله در ledger ثبت شوند. فقط blocker/critical issue اجازه دارد focus تسک جاری را بشکند.

## مستندات جاری

- `docs/platform-foundation.md` — working record اصلی برای Task status، معماری زبان، component inventory و Bug/Debt Ledger.
- `docs/HANDOFF.md` — این فایل؛ باید بعد از هر مرحله معنادار با وضعیت واقعی ادامه کار sync شود.
- Governance docs — منبع قوانین اجرا هستند و نباید این فایل آن‌ها را duplicate یا override کند.

## Validation State

در محیط فعلی GitHub connector امکان اجرای واقعی local build/test/browser وجود ندارد.

بنابراین تا این لحظه:

- Build: **NOT RUN**
- Typecheck: **NOT RUN**
- Tests: **NOT RUN**
- Browser visual verification: **NOT RUN**
- Deployment: **NOT RUN**

هیچ‌کدام نباید بدون اجرای واقعی PASS گزارش شوند.

## قدم بعدی

1. تکمیل consumer-level Component Inventory.
2. بررسی دقیق Footer/Site Settings localization boundary.
3. تعیین مدل canonical و language-neutral برای game metadata + locale presentation.
4. ثبت یافته‌ها در `docs/platform-foundation.md` و sync همین HANDOFF.
5. سپس بستن Tasks 0–3 و ورود کنترل‌شده به Component Graveyard Cleanup / Shared UI Foundation.

## اجرای محلی فعلی پروژه

```bash
npm install
npm run build
npm test
npm run dev
```

## Release Safety

- `main` در این refactor مستقیماً تغییر نمی‌کند.
- merge به `main` فقط بعد از validation و تصمیم صریح انجام می‌شود.
- deploy فقط با مجوز صریح انجام می‌شود.
- production verification فقط پس از deploy واقعی قابل PASS است.

## عملیات Production فعلی

روش deployment موجود پروژه همچنان Zero Build است:

```bash
./scripts/deploy.sh
```

اما اجرای آن بخشی از Tasks 0–3 نیست.

محافظت‌های عملیاتی production همچنان معتبرند:

1. قبل از deployment وجود `/opt/bazigb/.env` بررسی شود.
2. پس از deployment وضعیت `bazigb-server` و `bazigb-web` و health API بررسی شود.
3. backup database در `/opt/bazigb/backups/` نگهداری می‌شود.
