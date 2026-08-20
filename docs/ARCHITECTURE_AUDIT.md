# BaziGB — Architecture Audit (Phase 0)

> منبع: سند حسابرسی معماری فاز ۰ (۱۹ اوت ۲۰۲۶) — مبنای ساختار این مخزن.

## معماری هدف

Monorepo با npm workspaces:

```
bazigb/
├── apps/
│   ├── server/          # NestJS (API + Socket.IO Gateway + Prisma)
│   └── web/             # Next.js 14 + MUI 5 (Client components)
├── packages/
│   ├── engine/          # هسته منطق بازیها (Turn/Dice/Phase Engine)
│   └── games/
│       ├── backgammon/  # منطق تختهنرد + ai.ts
│       ├── chess/       # منطق شطرنج
│       ├── tic-tac-toe/ # منطق دوز + ai.ts
│       └── vegas/       # منطق وگاس
└── docs/
```

## نقشه ماژولها

| ماژول | مسیر | مسئولیت | وضعیت |
| --- | --- | --- | --- |
| Engine | `packages/engine` | توابع عمومی `BaziGBEngine`، تایپ `Game/GameState` | ✅ ایزوله |
| Backgammon | `packages/games/backgammon` | منطق خالص بازی + AI | ✅ ایزوله |
| Chess | `packages/games/chess` | منطق خالص شطرنج | ✅ ایزوله |
| TicTacToe | `packages/games/tic-tac-toe` | منطق خالص دوز + AI | ✅ ایزوله |
| Vegas | `packages/games/vegas` | منطق خالص وگاس | ✅ ایزوله |
| Server Auth | `apps/server/src/auth` | JWT/OTP/RBAC | ⚠️ JWT فعال، OTP در فاز بعد |
| Server Rooms | `apps/server/src/rooms` | مدیریت اتاقها | ✅ فعال |
| Server Game GW | `apps/server/src/game` | Socket Gateway + GameEngineService (تفکیکشده) | ✅ تفکیک MOD-007 |
| Server Tournaments | `apps/server/src/tournaments` | تورنمنتها | ⚠️ جاینگهدار |
| Server Leaderboard | `apps/server/src/leaderboard` | رتبهبندی | ⚠️ جاینگهدار |
| Server Admin | `apps/server/src/admin` | داشبورد ادمین | ⚠️ جاینگهدار |
| Server Notifications | `apps/server/src/notifications` | اعلانها | ⚠️ جاینگهدار |
| Server SMS | `apps/server/src/sms` | سرویس sms.ir | ⚠️ جاینگهدار |
| Web Lobby | `apps/web/src/app/lobby` | لابی و ساخت اتاق | ✅ فعال |
| Web Game UI | `apps/web/src/app/game` | صفحه بازی | ✅ فعال |
| Web Components | `apps/web/src/components/{game,layout,shared}` | بوردها + هدر/فوتر + مشترک | ✅ MOD-009 |

## گراف وابستگیها

```
@bazigb/engine (سطح ۰)
   ↑
   ├── @bazigb/game-backgammon      (سطح ۱)
   ├── @bazigb/game-chess           (سطح ۱)
   ├── @bazigb/game-tic-tac-toe     (سطح ۱)
   └── @bazigb/game-vegas           (سطح ۱)
         ↑
   ┌─────┴──────────┐
apps/server (NestJS)  apps/web (Next.js)
```

## قوانین مرزی (تأییدشده)

- ✅ بازیها فقط از `@bazigb/engine` import دارند
- ✅ سرور از API عمومی بازیها استفاده میکند (نه فایلهای داخلی)
- ✅ وب از API عمومی بازیها استفاده میکند (قرارداد ثبتشده)
- ✅ هیچ وابستگی حلقوی بین پکیجها

## محدودیتهای دیپلوی

- سرور تولید: `193.151.153.204` — روش: Zero Build (rsync + آرتیفکت محلی)
- **دیتابیس (CURRENT):** SQLite از طریق Prisma (`apps/server/prisma/schema.prisma`). **هدف (TARGET):** PostgreSQL — `docker-compose.yml` آماده است؛ تصمیم D-01 (مهاجرت) هنوز موکول است.
- دامنه `bazigb.ir` + Caddy (SSL خودکار)
- **قانون:** تکبرنچ `main` — توسعه و تولید روی یک شاخه (شاخه ماژولارسازی حذف شد)
