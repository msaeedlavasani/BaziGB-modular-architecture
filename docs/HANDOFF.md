# BaziGB — HANDOFF (تحویل و ادامه کار)

## وضعیت فعلی

- **Baseline تولید:** `main`
- **Working branch:** `refactor/platform-foundation-i18n-v3`
- **Governance source:** آخرین نسخه تاییدشده روی `ai/autonomous-development-system-v1`
- **Production:** این branch هنوز merge یا deploy نشده است.
- **هدف جاری:** تثبیت Platform Foundation، معماری دو زبان، حذف component/metadata graveyard و آماده‌سازی پلتفرم برای توسعه کم‌رفت‌وبرگشت.

## آخرین مرحله انجام‌شده

این مرحله سه محور داشت:

1. تکمیل بخشی از consumer-level Component Inventory.
2. تبدیل Footer/Site Settings به foundation سازگار با دو زبان بدون migration دیتابیس.
3. ایجاد canonical game presentation catalog برای حذف metadata duplication در مراحل بعد.

### تغییرات واقعی

- `apps/web/src/lib/site-settings.ts`
  - defaults مستقل `fa` و `en`.
  - `fetchSiteSettings(locale)`.
  - legacy Persian footer همچنان backward-compatible است.
  - API نوشتن locale-specific تحت `footer.fa` / `footer.en` اضافه شده، در حالی که `saveFooterSettings` فعلی برای Admin قدیمی حفظ شده است.

- `apps/server/src/site-settings/site-settings.controller.ts`
  - public response اکنون هم `footer` قدیمی و هم `footers.fa` / `footers.en` را برمی‌گرداند.
  - داده فعلی `footer` فقط Persian محسوب می‌شود و به English نشت نمی‌کند.
  - persistence همان generic JSON-by-key باقی مانده؛ Prisma migration لازم نیست.

- `apps/web/src/i18n/messages.ts`
  - Footer Rules/Contact labels برای هر دو زبان اضافه شد.

- `apps/web/src/components/layout/Footer.tsx`
  - locale-aware managed content و labels.
  - prop اختیاری `locale` با default فارسی.
  - routeها فعلاً locale-neutral باقی مانده‌اند تا migration مسیرها یکپارچه انجام شود.

- `apps/web/src/app/layout.tsx`
  - default locale به Footer نیز پاس داده می‌شود.

- `apps/web/src/lib/game-catalog.ts` (جدید)
  - source واحد وب برای اتصال `GameId` به message key، chip symbol و presentation capacity.
  - titleها از i18n خوانده می‌شوند و در catalog duplicate نمی‌شوند.
  - هنوز consumer migration انجام نشده؛ `/game`, `/play`, Lobby نباید برای همیشه local mapهای قدیمی را کنار این catalog نگه دارند.

## Task 0–3

### Task 0 — Baseline & Governance Check
**Status: COMPLETE FOR THIS BRANCH**

- کار از `main` جداست.
- deploy مجاز یا انجام‌شده نیست.
- validation اجرایی در این connector environment قابل اجرا نیست و PASS اعلام نشده است.

### Task 1 — Persian / English Architecture
**Status: IN PROGRESS**

مدل هدف ثابت است:

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

انجام‌شده:
- locale config
- locale-aware theme/providers
- Header/Footer shell copy
- locale-aware Footer read/storage contract

باقی‌مانده:
- dictionaries گسترده‌تر
- `/fa/...` و `/en/...` route structure
- localized link generation
- Admin bilingual Footer editor

### Task 2 — Platform Architecture Audit
**Status: IN PROGRESS**

یافته‌های مهم:
- mixed-language copy در Lobby/Tournaments و game pages.
- Footer localization یک مسئله cross-layer بود؛ Web + Admin + Server.
- game presentation metadata در چند entry point duplicate است.
- Admin page مسئولیت‌های زیادی را در یک فایل نگه می‌دارد.

### Task 3 — Component Inventory
**Status: IN PROGRESS**

وضعیت فعلی:

- `GameShell`: `CANONICAL` — مصرف واقعی در local/bot و multiplayer.
- `Dice3D`: `CANONICAL REUSABLE GAME PRIMITIVE` — مصرف واقعی در BackgammonBoard تایید شد.
- `GameCard`: `UNUSED_CANDIDATE / INLINE_DUPLICATE` — با Lobby duplication دارد.
- `EmptyState`: `UNUSED_CANDIDATE` در صفحات بررسی‌شده.
- `LoadingSkeleton`: `UNUSED_CANDIDATE / TOO_NARROW?` در صفحات بررسی‌شده.
- `Modal`: `UNUSED_CANDIDATE` در targeted inspection؛ قبل از حذف validation مصرف نهایی لازم است.

هیچ‌کدام از unused candidateها هنوز حذف نشده‌اند.

## Bug / Debt Ledger Summary

جزئیات کامل: `docs/platform-foundation.md`

موارد مهم جدید/به‌روز:

- `DEBT-005` Footer single-locale → **PARTIALLY MITIGATED**.
- `DEBT-006` duplicate game metadata → canonical catalog ساخته شد، consumer migration هنوز باقی است.
- `DEBT-011` Footer cross-layer localization → Server/Web contract اصلاح شد؛ Admin editor باقی است.
- `DEBT-013` canonical game catalog قبل از migration consumerها → باید سریعاً مصرف‌کنندگان migrate شوند تا خود catalog به registry مرده جدید تبدیل نشود.

## Component Graveyard Rule

وجود یک shared component یا registry به‌تنهایی موفقیت نیست. هر abstraction باید consumer واقعی داشته باشد.

قبل از حذف/ساخت:

1. inspect implementation
2. verify consumers
3. compare inline duplicates
4. choose canonical implementation
5. migrate consumers
6. validate
7. remove dead duplicate

## Validation State

در محیط فعلی GitHub connector اجرای محلی واقعی در دسترس نیست:

- Build: **NOT RUN**
- Typecheck: **NOT RUN**
- Tests: **NOT RUN**
- Browser visual verification: **NOT RUN**
- Deployment: **NOT RUN**

هیچ PASS حدسی ثبت نشده است.

## قدم بعدی دقیق

1. migrate کردن `/game/[gameId]`, `/play/[roomId]` و Lobby از metadata mapهای محلی به `game-catalog.ts`.
2. گسترش locale dictionaries برای Lobby/game pages/Profile/Tournaments/common feedback.
3. طراحی و اجرای locale-scoped route migration به‌صورت اتمیک.
4. افزودن Admin editor واقعی برای `footer.fa` / `footer.en`.
5. سپس ورود به Component Graveyard Cleanup و Shared UI Foundation.

## Safety / Release

- `main` تغییر نمی‌کند.
- Governance branch تغییر نمی‌کند.
- merge به `main`: انجام نشده.
- deploy: انجام نشده.
- production verification: انجام نشده.

روش deployment موجود پروژه همچنان Zero Build است، اما در این مرحله نباید اجرا شود.
