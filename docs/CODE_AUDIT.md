# BaziGB — Code & Repository Audit (Phase 0)

> تاریخ: 2026-08-20 — برنچ فعال: `main` — متد: بازرسی مستقیم ریپو (بدون تغییر کد)
> مرجع: FINAL ACCIO REPOSITORY AUDIT & IMPLEMENTATION PROTOCOL

---

## 1. REPOSITORY STATE (CURRENT)

| مورد | وضعیت | شواهد |
| --- | --- | --- |
| برنچ فعال | `main` (هر دو برنچ main و refactor/modular-architecture در کامیت 1e1184d هم‌گام‌اند) | `git branch --show-current` / `git rev-list --count` |
| Monorepo | npm workspaces: `apps/*`, `packages/*`, `packages/games/*` | root package.json |
| سرور | NestJS 10 (REST + Socket.IO)، Prisma **SQLite** (`file:./dev.db`) | schema.prisma:6 |
| وب | Next.js 14 + MUI 5 + emotion، RTL فارسی (Vazirmatn) | apps/web/package.json |
| engine | `@bazigb/engine` — بدون هیچ dependency | packages/engine/package.json |
| بازی‌ها | backgammon / chess / tic-tac-toe / vegas — فقط وابسته به `@bazigb/engine` | packages/games/*/package.json |
| اسکریپت‌ها | `deploy.sh` (rsync+systemd)، `server-setup.sh` | scripts/ |
| docker-compose.yml | موجود اما با دیپلوی واقعی (systemd) هم‌خوانی ندارد | root docker-compose.yml |
| **AGENTS.md** | **❌ وجود ندارد** (فایل حاکمیتی شماره ۱ پروتکل مفقود است) | read → File not found |
| DESIGN_SYSTEM.md | ✅ موجود (۵۷ خط، Honey Bronze) | ریشه ریپو |

**UNKNOWN — قابل راستی‌آزمایی در ریپو نیست:** اینکه آیا docker-compose.yml هنوز روی سرور دیگری استفاده می‌شود یا منسوخ است.

---

## 2. DOCUMENTATION INVENTORY

| سند | نوع | اکشن پیشنهادی |
| --- | --- | --- |
| `DESIGN_SYSTEM.md` | GOVERNANCE | KEEP (متعارف UI) |
| `docs/ARCHITECTURE_AUDIT.md` | GOVERNANCE/CURRENT | **UPDATE** (تناقض دیتابیس) |
| `docs/ARCHITECTURE_REFACTOR_REPORT.md` | CURRENT/HISTORICAL | UPDATE (وضعیت مرزها دستی/قدیمی) |
| `docs/HANDOFF.md` | CURRENT KNOWLEDGE (عملیاتی) | **UPDATE** (Docker→systemd، SQLite، برنچ) |
| `docs/ISSUES.md` | CURRENT KNOWLEDGE | UPDATE (باگ‌های جدید) |
| `docs/MODULARIZATION_TASKS.md` | ACTIVE WORK (بک‌لاگ متعارف) | UPDATE (وضعیت MOD-008/011/013) |
| `docs/legacy-audit-and-tech-debt.md` | ACTIVE WORK/DEBT | MERGE (بدهی‌ها → بک‌لاگ) |
| `docs/monetization-strategy.md` | STRATEGY | KEEP (بدون تسک اجرایی فعلی) |
| `README.md` | CURRENT (روی‌بورد انسانی) | UPDATE (قانون شاخه قدیمی) |

---

## 3. DOCUMENTATION CONFLICTS

1. **دیتابیس: PostgreSQL (مستند) در برابر SQLite (واقعیت)**
   - `docs/ARCHITECTURE_AUDIT.md` و `docker-compose.yml` (postgres:16-alpine) → PostgreSQL
   - `apps/server/prisma/schema.prisma:6` → `provider = "sqlite"` — واقعیت فعلی SQLite است
   - `docs/legacy-audit-and-tech-debt.md` این تناقض را تأیید کرده (بدهی فنی: مهاجرت به PostgreSQL)
   - **حکم:** PostgreSQL = TARGET؛ SQLite = CURRENT. سند باید هر دو را صریح کند.

2. **دیپلوی: Docker (مستند) در برابر systemd (واقعیت)**
   - `docs/HANDOFF.md:29,35-36` + `docker-compose.yml` → کانتینرهای bazigb-db-1/server-1/web-1/caddy-1
   - `scripts/deploy.sh` → rsync + `systemctl restart bazigb-server bazigb-web` (سرویس‌های systemd)
   - **حکم:** دیپلوی فعلی = Zero Build + systemd؛ docker-compose.yml بلااستفاده (DEBT/UNKNOWN).

3. **برنچ: «توسعه در refactor/modular-architecture» (مستند) در برابر main (واقعیت)**
   - ارجاعات: `README.md:29,73`، `docs/HANDOFF.md:7,31`، `docs/ARCHITECTURE_AUDIT.md:70`، `docs/MODULARIZATION_TASKS.md:15,32`، `docs/ARCHITECTURE_REFACTOR_REPORT.md:31`
   - برنچ فعال `main` است و هر دو شاخه هم‌گام‌اند (۱e1184d) — این ارجاعات اکنون **تاریخی/گمراه‌کننده**اند.
   - **حکم:** UPDATE — main = برنچ فعال و تنها منبع حقیقت؛ refactor فقط تاریخچه.

4. **وضعیت MOD-008:** `MODULARIZATION_TASKS.md` نیمه‌تمام (🔄) اما `ARCHITECTURE_REFACTOR_REPORT.md` مرزها را سبز (✅) اعلام کرده — بررسی دستی به جای خودکار.

---

## 4. DOCUMENTATION BLOAT FINDINGS

| تکرار | محل‌ها | اکشن |
| --- | --- | --- |
| گراف پکیج‌ها / معماری | README + ARCHITECTURE_AUDIT + REFACTOR_REPORT (۳ جا) | KEEP یک منبع متعارف (ARCHITECTURE_AUDIT)؛ README خلاصه کوتاه |
| قوانین ایزولگی بازی‌ها (بدون React/Nest) | README + ARCH_AUDIT + REFACTOR_REPORT | یک منبع واحد |
| قانون «شاخه تولید دست نمی‌خورد» | ≥۵ فایل | حذف از اسناد (تاریخی) |
| لیست تسک‌ها | MODULARIZATION_TASKS.md + legacy-audit-and-tech-debt.md | یک بک‌لاگ متعارف |

اکشن: MERGE/DEPRECATE موارد تکراری؛ KEEP محتوای تاریخی به‌عنوان تاریخچه، بدون ارائه به‌عنوان وضعیت فعلی.

---

## 5. DOCUMENTATION CHANGES (پیشنهادی — نیازمند تأیید)

| # | تغییر | چرا |
| --- | --- | --- |
| DOC-1 | **ایجاد `AGENTS.md`** (فایل حاکمیتی AI: رفتار مهندسی، سلسله‌مراتب source-of-truth، انضباط وابستگی، قوانین پیاده‌سازی) | مفقود است — بدون آن هیچ حاکمیت رفتاری AI وجود ندارد |
| DOC-2 | UPDATE `HANDOFF.md`: systemd + SQLite + برنچ main + حذف ارجاعات docker | توصیف نادرست وضعیت فعلی |
| DOC-3 | UPDATE `ARCHITECTURE_AUDIT.md`: دیتابیس CURRENT=SQLite / TARGET=PostgreSQL؛ برنچ main | تناقض داخلی |
| DOC-4 | UPDATE `README.md`: حذف/تاریخی‌سازی قانون شاخه refactor | اطلاعات قدیمی به‌عنوان فعلی |
| DOC-5 | MERGE بدهی‌های legacy-audit به بک‌لاگ متعارف (MODULARIZATION_TASKS یا GitHub Issues) | دو بک‌لاگ پراکنده |
| DOC-6 | UPDATE وضعیت MOD-008/011/013 بر اساس کد فعلی | ناسازگاری وضعیت |

---

## 6. ARCHITECTURE AUDIT (CURRENT — ✅ سالم)

- **جهت وابستگی تأیید شد:** `@bazigb/engine` ↑ ← game packages ↑ ← apps/server + apps/web
- **بدون نشت فریم‌ورک:** grep سراسری در packages → هیچ import از react/next/@nestjs/prisma/mui یافت نشد
- **بدون API مرورگر در پکیج‌ها:** هیچ window/document/localStorage
- **پیاده‌سازی کامل GameAdapter** در هر ۴ بازی (createState/getLegalMoves/applyMove/applyChain/isFinished/getWinner/serialize) — همه خالص و تغییرناپذیر
- **AI درون پکیج‌ها** (`src/ai.ts`) — قابل اجرا هم در کلاینت و هم سرور
- **sanitizeMatch** در engine: Match Point / Win-by-2 را به‌اجبار فقط برای نرد/دوز فعال می‌کند (حتی اگر ورودی true باشد)
- **بدون منطق تکراری** قوانین بازی بین server/web/packages
- **Circular dependency:** یافت نشد

---

## 7. DEPENDENCY AUDIT

| وابستگی | طبقه‌بندی | شواهد |
| --- | --- | --- |
| `@mui/icons-material` (web) | **UNUSED** | صفر استفاده در src؛ ۱۱ فایل از lucide-react استفاده می‌کنند |
| `lucide-react` (web) | ACTIVELY USED (۱۱ فایل: Trophy, Swords, Undo2, Dice1-6, Banknote, Flame, Crown, Medal و...) | grep |
| `react-chessboard` + `chess.js` | SPECIALIZED (توجیه‌شده) — برد شطرنج با direction:ltr و یکپارچگی بالا | ChessBoard.tsx |
| `bcrypt` (server) | ACTIVELY USED — change-password + کاربر placeholder تاریخچه | auth.service.ts, history.service.ts |
| `class-validator`/`class-transformer` | ACTIVELY USED (پایپ سراسری + DTOهای HTTP) | main.ts, auth/dto |
| `zod` (server) | ACTIVELY USED (فقط socket-validation.ts) | — |
| `@bazigb/engine` در server/web | REQUIRED | — |
| بقیه (Nest core, socket.io, jwt, prisma, emotion, mui) | REQUIRED | — |

**نتیجه:** فقط یک وابستگی بلااستفاده (`@mui/icons-material`). حذف آن یا تصمیم آگاهانه درباره سیاست آیکون لازم است (بند ۸).

---

## 8. DESIGN SYSTEM AUDIT (✅ عمدتاً منطبق)

- **تم MUI با Honey Bronze:** `primary.main=#EEAC2F`، سرمه `#061A2D`، `bgDeep=#0B1622` — هیچ رنگ پیش‌فرض MUI در theme.ts
- **RTL:** `dir="rtl"` + `lang="fa"` در layout.tsx؛ بردها direction درست
- **Responsive:** breakpoints گسترده؛ احترام به ۳۶۰px
- **شطرنج:** react-chessboard با استایل BaziGB هماهنگ (خانه‌های چوبی/هایلایت برنزی)
- **نقص a11y (P3):** دکمه‌های آیکونی در GameShell و برخی کارت‌ها فاقد `aria-label` صریح
- **سیاست آیکون:** DESIGN_SYSTEM/پروتکل می‌گوید MUI Icons ترجیحی است اما عملاً lucide-react در ۱۱ فایل و MUI Icons در صفر فایل. توصیه: پذیرش آگاهانه lucide به‌عنوان سیستم آیکون BaziGB (یا wrapper مشترک) — P4.

---

## 9. CODE AUDIT

| ID | شدت | محل | مشکل | وضعیت |
| --- | --- | --- | --- | --- |
| AUD-001 | **P1** | ریشه ریپو | **AGENTS.md مفقود** — بدون حاکمیت رفتاری AI | OPEN |
| AUD-002 | **P1** | docs + config | تناقض دیتابیس (Postgres مستند / SQLite واقعی) — گمراه‌کننده برای توسعه آینده | OPEN |
| AUD-003 | **P1** | docs + docker-compose.yml | تناقض دیپلوی (Docker مستند / systemd واقعی) | OPEN |
| AUD-004 | **P2** | apps/server/src/main.ts | **نبود Rate Limiting سراسری** (فقط گارد دستی ۶۰ ثانیه‌ای OTP + شمارنده attempts) | OPEN |
| AUD-005 | **P2** | apps/server/src/game/game.gateway.ts | مرجعیت سرور: ✅ تأیید شد — چک `turn===client.id`، اعتبارسنجی adapter در applyValidatedMove، تاس سمت سرور، undo فقط با actorId، گارد JSON.stringify در expireTurn | OK |
| AUD-006 | **P2** | game.gateway.ts | چرخه حیات سوکت: ✅ تأیید شد — پاکسازی در handleDisconnect، بازپس‌گیری صندلی با ۳ کلید (userId/seatKey/socketId)، clearTurnTimers، spectator | OK |
| AUD-007 | **P2** | apps/web/src/components/game/GameShell.tsx و... | دکمه‌های آیکونی بدون aria-label | OPEN |
| AUD-008 | **P3** | apps/web/package.json | `@mui/icons-material` بلااستفاده | OPEN |
| AUD-009 | **P3** | docs | بک‌لاگ پراکنده + وضعیت MOD-008 ناسازگار | OPEN |
| AUD-010 | **P4** | — | wrapper مشترک آیکون lucide (نرمال‌سازی size/stroke/color/a11y) | OPEN |
| AUD-011 | **P4** | game.gateway.ts | پیام چت «حرکت بازگردانی شد» در هندلر undo موجود نیست | OPEN |
| AUD-012 | **P4** | apps/server | هیچ تست واحد برای گیتوی/سرور — فقط ۵۲ تست پکیج‌ها (engine 13, backgammon 12, chess 7, ttt 10, vegas 10) | OPEN |

**نتیجه کد:** هسته معماری و منطق بازی بسیار سالم؛ یافته‌های بحرانی (P0) وجود ندارد. مسائل عمدتاً مستنداتی/سخت‌افزاری (docs) و بهینه‌سازی امنیتی‌اند.

---

## 10. PROPOSED IMPLEMENTATION TASKS (نیازمند تأیید — به بک‌لاگ متعارف اضافه شوند)

| ID | عنوان | اولویت | وضعیت |
| --- | --- | --- | --- |
| T-001 | ایجاد فایل حاکمیتی AGENTS.md (رفتار AI، سلسله‌مراتب حقیقت، قواعد پیاده‌سازی) | P1 | pending |
| T-002 | یکسان‌سازی مستندات با واقعیت: HANDOFF (systemd/SQLite/main) + ARCHITECTURE_AUDIT (CURRENT vs TARGET) | P1 | pending |
| T-003 | تعیین تکلیف docker-compose.yml (حذف، یا ثبت به‌عنوان TARGET با ADR) | P2 | pending |
| T-004 | به‌روزرسانی README: برنچ main متعارف، refactor = تاریخی | P2 | pending |
| T-005 | افزودن Rate Limiting (ThrottlerModule یا محدودیت سوکت) | P2 | pending |
| T-006 | افزودن aria-label به دکمه‌های آیکونی (GameShell و...) | P2 | pending |
| T-007 | حذف `@mui/icons-material` یا تصمیم آگاهانه سیاست آیکون (ADR) | P3 | pending |
| T-008 | ادغام بدهی‌های legacy-audit در بک‌لاگ متعارف + اصلاح وضعیت MOD-008/011/013 | P3 | pending |
| T-009 | (اختیاری) wrapper آیکون lucide مشترک | P4 | pending |
| T-010 | (اختیاری) پیام undo در چت | P4 | pending |
| T-011 | (اختیاری) تست‌های واحد گیتوی/سرور | P4 | pending |

---

## 11. PROPOSED ADRs (نیازمند تأیید)

| ADR | موضوع | وضعیت پیشنهادی |
| --- | --- | --- |
| ADR-001 | استراتژی دیتابیس: SQLite CURRENT / PostgreSQL TARGET (چه زمانی مهاجرت؟) | Proposed |
| ADR-002 | معماری دیپلوی متعارف: Zero Build + systemd (آیا docker-compose حذف شود؟) | Proposed |
| ADR-003 | استراتژی برنچ: main به‌عنوان تنها منبع حقیقت؛ refactor بازنشسته | Proposed |
| ADR-004 | سیستم آیکون: lucide-react متعارف (با توجه به ۱۱ فایل) در برابر MUI Icons | Proposed |

---

## 12. RISKS

| ریسک | شدت | توضیح |
| --- | --- | --- |
| گمراه‌سازی توسعه‌دهنده/AI آینده توسط تناقض‌های مستندات (Postgres/Docker/برنچ) | HIGH | ممکن است کسی دیتابیس را به Postgres مهاجرت دهد یا دیپلوی Docker بزند در حالی که تولید systemd+SQLite است |
| نبود Rate Limiting روی سرور عمومی | MEDIUM | خطر Brute-force/سوءاستفاده از OTP و اکشن‌های سوکت |
| عدم وجود AGENTS.md | MEDIUM | رفتار AI آینده بدون حاکمیت؛ انحراف معماری تدریجی |
| سردرگمی برنچ | MEDIUM | توسعه روی شاخه اشتباه با استناد به README قدیمی |
| docker-compose.yml بلااستفاده | LOW | کد/پیکربندی مرده در ریپو (باگ پنهان برای deploy آینده) |

---

## 13. VALIDATION PLAN

| مورد | روش | وضعیت |
| --- | --- | --- |
| جهت وابستگی پکیج‌ها | grep سراسری import در packages | ✅ اجرا شد |
| استفاده واقعی وابستگی‌ها | grep استفاده هر dep | ✅ اجرا شد |
| تم/توکن‌های Design System | بازبینی theme.ts در برابر DESIGN_SYSTEM.md | ✅ اجرا شد |
| مرجعیت سرور | بازبینی game.gateway.ts (خطوط ۴۸۵-۶۰۹) | ✅ اجرا شد |
| برنچ و هم‌گامی | git rev-list --left-right --count | ✅ اجرا شد (0/0 هر دو شاخه) |
| Typecheck | `npm run typecheck` (در صورت اجرای تغییرات بعدی) | ⏳ پس از تأیید |
| تست‌ها | `npm test` — ۵۲ تست (engine+games) | ⏳ پس از تأیید |
| عدم تغییر کد در این فاز | git status (تمیز) | ✅ اجرا شد |

---

## خلاصه

ریپو از نظر **معماری کد بسیار سالم** است (مرز پکیج‌ها رعایت شده، مرجعیت سرور قوی، منطق بازی خالص و تست‌شده — ۵۲ تست). مشکل اصلی این ریپو **مستندات و حاکمیت** است: `AGENTS.md` مفقود، تناقض دیتابیس/دیپلوی، و ارجاعات برنچ قدیمی. هیچ یافته P0 (بحرانی) وجود ندارد.
