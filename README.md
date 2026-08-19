# BaziGB — پلتفرم بازیهای ایرانی (معماری مدولار)

پلتفرم آنلاین بازیهای **نرد، دوز، شطرنج و وگاس** با معماری Monorepo مدولار.

## ساختار

```
bazigb/
├── apps/
│   ├── server/          # NestJS (API + Socket.IO Gateway)
│   └── web/             # Next.js 14 + MUI 5 (Client components)
├── packages/
│   ├── engine/          # @bazigb/engine — هسته منطق (Turn/Dice/Phase Engine)
│   └── games/
│       ├── backgammon/  # @bazigb/game-backgammon — نرد + AI
│       ├── chess/       # @bazigb/game-chess — شطرنج
│       ├── tic-tac-toe/ # @bazigb/game-tic-tac-toe — دوز + AI
│       └── vegas/       # @bazigb/game-vegas — وگاس
├── docs/                # مستندات معماری و عملیاتی
├── scripts/             # دیپلوی Zero Build
└── DESIGN_SYSTEM.md     # استاندارد طراحی Elite
```

## قوانین معماری (غیرقابل تغییر)

1. **ایزولگی بازیها:** هر پکیج بازی فقط از `@bazigb/engine` import میکند — هیچ وابستگی به React/NestJS/Prisma.
2. **جداسازی قوانین:** Match Point و Win by 2 **فقط** برای نرد و دوز؛ شطرنج و وگاس هرگز (اجرا توسط `sanitizeMatch` در موتور).
3. **حرکات ترکیبی (Combined Moves):** زنجیره حرکات میانی برای نرد/وگاس؛ سرور هر گام زنجیره را جداگانه اعتبارسنجی میکند (`applyChain`).
4. **شاخه تولید دست نمیخورد:** کارهای ماژولارسازی در `refactor/modular-architecture`.
5. **تغییرناپذیری:** تمام توابع بازی خالص (Pure) و تغییرناپذیر (Immutable) هستند.

## شروع سریع

```bash
# نصب وابستگیها (workspaces)
npm install

# بیلد همه پکیجها
npm run build

# تستهای واحد بازیها
npm test

# اجرای توسعه (سرور :3001 + وب :3000)
npm run dev
```

- وب: http://localhost:3000
- سرور: http://localhost:3001/api
- محیط: از `.env.example` کپی کنید → `.env`

## دیپلوی (Zero Build)

بیلد محلی → انتقال آرتیفکت به سرور `193.151.153.204:/opt/bazigb` (بدون بیلد روی VPS):

```bash
./scripts/deploy.sh
```

جزئیات در [docs/HANDOFF.md](docs/HANDOFF.md) و پروتکل [bazigb-deployment-protocol].

## بازیها و سطوح AI

| بازی | API عمومی | AI |
| --- | --- | --- |
| دوز | `TicTacToe`, `getBestMove` | easy/medium(خطای ۲۰٪)/hard(Minimax α-β) |
| نرد | `Backgammon`, `getLegalDestinations`, `canBearOff`, `getMoveHints`, `getBestMoveSequence` | easy/medium/hard(2-ply) |
| شطرنج | `ChessGame`, `getBestMove` | easy/medium/hard(Minimax) |
| وگاس | `Vegas`, `getBestMove` | easy/medium/hard(مارتینگل) |

## نقشه راه ماژولارسازی

فهرست کامل تسکها (MOD-001 تا MOD-014) در [docs/MODULARIZATION_TASKS.md](docs/MODULARIZATION_TASKS.md) و وضعیت اجرا در [docs/ARCHITECTURE_REFACTOR_REPORT.md](docs/ARCHITECTURE_REFACTOR_REPORT.md).
