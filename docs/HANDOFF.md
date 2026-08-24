# BaziGB — HANDOFF (تحویل و ادامه کار)

## وضعیت فعلی

- **Baseline تولید:** `main`
- **Working branch:** `refactor/platform-foundation-i18n-v3`
- **Governance source:** آخرین نسخه تاییدشده روی `ai/autonomous-development-system-v1`
- **Production:** این branch هنوز merge یا deploy نشده است.
- **مرحله:** Taskهای 0–3 برای Foundation/Audit بسته شده‌اند؛ مرحله بعد consumer migration + bilingual implementation cleanup است.

## خلاصه آخرین مرحله

Foundation دو زبان و audit اولیه اکنون به حدی رسیده که معماری تصمیم‌گیری‌شده است و ادامه کار نیازمند discovery گسترده دوباره نیست.

### اضافه/اصلاح شده

- `apps/web/src/i18n/config.ts`
  - `fa` / `en`
  - RTL/LTR
  - locale font + metadata

- `apps/web/src/i18n/messages.ts`
  - navigation
  - common feedback
  - game names
  - game-shell copy
  - Lobby copy
  - Tournament status/fallback copy
  - Footer labels

- `apps/web/src/i18n/routing.ts`
  - `APP_ROUTES`
  - `localePath`
  - `localizedAppRoute`
  - `stripLocale`
  - `resolveLocaleFromPathname`
  - `gameRoute` / `playRoute`
  - این helperها route migration را آماده می‌کنند ولی هنوز `/fa` و `/en` را در production tree فعال نکرده‌اند.

- Header
  - route literalهای اصلی از `APP_ROUTES` می‌آیند.
  - active state با `stripLocale` هم route فعلی و هم future locale-prefixed route را می‌فهمد.
  - labelها locale-aware هستند.

- Footer
  - locale-aware managed content + labels.
  - route identityهای ثابت از `APP_ROUTES`.

- Footer/Site Settings
  - legacy `footer` = Persian compatibility.
  - `footer.fa` / `footer.en` storage.
  - public response: `footer` + `footers.fa` / `footers.en`.
  - English محتوای Persian legacy را inherit نمی‌کند.
  - Prisma migration لازم نیست.

- `apps/web/src/lib/game-catalog.ts`
  - canonical web presentation bridge برای `GameId`.
  - localized titleها در messages باقی می‌مانند.
  - chip symbol + presentation fallback capacity یک منبع دارند.
  - `isWebGameId` و lookup helper اضافه شده‌اند.
  - Runtime player capability همچنان باید از GameAdapter بیاید، نه web catalog.

## Task 0–3 Status

### Task 0 — Baseline & Governance Check
**COMPLETE FOR THIS BRANCH**

- `main` دست نخورده است.
- deploy انجام نشده است.
- branch از main جدا و جلوتر است.

### Task 1 — Persian / English Architecture
**COMPLETE AS FOUNDATION — MIGRATION PENDING**

مدل قطعی:

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

Architecture دیگر سوال باز ندارد. باقیمانده implementation است:
- page consumer migration
- locale route tree
- active locale layouts
- bilingual Admin Footer editor

### Task 2 — Platform Architecture Audit
**COMPLETE FOR FOUNDATION SCOPE**

یافته‌ها ثبت شده‌اند:
- mixed-language Lobby/Tournaments/game pages
- Footer cross-layer localization
- duplicate game presentation metadata
- component graveyard risk
- shared feedback primitives bypass
- Admin monolith

### Task 3 — Component Inventory
**COMPLETE FOR INITIAL HIGH-TRAFFIC SCOPE**

- `GameShell`: `CANONICAL`
- `Dice3D`: `CANONICAL REUSABLE GAME PRIMITIVE`
- boards: `GAME_SPECIFIC`
- `Header` / `Footer`: `CANONICAL`
- `GameCard`: `UNUSED_CANDIDATE / INLINE_DUPLICATE`
- `EmptyState`: `UNUSED_CANDIDATE`
- `LoadingSkeleton`: `UNUSED_CANDIDATE / TOO_NARROW?`
- `Modal`: `UNUSED_CANDIDATE`

هیچ unused candidate هنوز حذف نشده است؛ حذف قبل از consumer migration + validation ممنوع است.

## Bug / Debt Ledger — وضعیت کلیدی

جزئیات کامل در `docs/platform-foundation.md`.

- `DEBT-001` global locale/direction → partially mitigated; active locale route layouts باقی است.
- `DEBT-002` Lobby mixed language → dictionary آماده، page migration باقی است.
- `DEBT-003` GameCard graveyard mismatch → باز.
- `DEBT-004` singleton RTL theme → foundation-level mitigated.
- `DEBT-005` Footer single-locale → partially mitigated; Admin + routing باقی است.
- `DEBT-006` duplicate game metadata → catalog آماده؛ consumer migration باقی است.
- `DEBT-007` locale-aware copy vs locale-neutral links → route identities centralized؛ locale tree باقی است.
- `DEBT-008` Persian game-page copy → game-shell dictionary آماده؛ page migration باقی است.
- `DEBT-009` shared feedback primitives bypass → باز.
- `DEBT-010` Tournament English copy → dictionary آماده؛ page migration باقی است.
- `DEBT-011` Footer Web/Admin/Server coupling → Server/Web coherent؛ Admin باقی است.
- `DEBT-012` Admin monolith → non-blocking debt.
- `DEBT-013` game catalog بدون consumer migration → باید در مرحله بعد حل شود تا registry جدید خودش graveyard نشود.
- Runtime bug جدید در این مرحله تایید نشده؛ چون runtime validation در این محیط قابل اجرا نیست.

## مرحله بعد — ترتیب دقیق

1. **Consumer migration برای metadata/copy**
   - `/game/[gameId]` → `game-catalog.ts` + `messages.gameShell`
   - `/play/[roomId]` → `game-catalog.ts` + locale messages
   - Lobby → game catalog + Lobby dictionary

2. **Bilingual page content migration**
   - Tournaments
   - Profile/common feedback
   - auth و copyهای باقیمانده

3. **Atomic locale route migration**
   - `/fa/...` و `/en/...`
   - active locale layout/theme/metadata
   - localized links
   - English نباید قبل از کامل‌شدن این migration expose شود.

4. **Admin bilingual Footer editor**
   - edit `footer.fa`
   - edit `footer.en`
   - legacy read compatibility تا پایان rollout حفظ شود.

5. **Component Graveyard Cleanup**
   - canonicalize GameCard / product feedback patterns
   - delete فقط بعد از executable validation

6. Lobby / GameShell standardization

## قواعد اجرایی مهم برای Agent بعدی

- discovery کل repo را از صفر تکرار نکن؛ `docs/platform-foundation.md` + latest governance + فایل affected نقطه شروع هستند.
- `main` را تغییر نده.
- governance branch را تغییر نده.
- deploy نکن.
- route migration را نصفه انجام نده.
- هر shared component/registry جدید باید consumer واقعی داشته باشد.
- runtime capability بازی را از web presentation metadata استخراج نکن؛ GameAdapter منبع capability است.
- هر bug/debt جدید را همان مرحله در `docs/platform-foundation.md` ثبت کن.
- این HANDOFF را بعد از هر مرحله معنادار sync کن.

## Validation State

محیط فعلی GitHub connector اجرای محلی واقعی ندارد:

- Build: **NOT RUN**
- Typecheck: **NOT RUN**
- Tests: **NOT RUN**
- Browser visual verification: **NOT RUN**
- Deployment: **NOT RUN**

هیچ PASS حدسی ثبت نشده است.

## Safety / Release

- `main`: NOT MODIFIED
- Governance branch: NOT MODIFIED
- Merged: NO
- Deployed: NO
- Production verified: NO

روش Zero Build موجود پروژه بخشی از این مرحله نیست و نباید اجرا شود مگر با مجوز صریح بعدی.
