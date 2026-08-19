# BaziGB — ARCHITECTURE_REFACTOR_REPORT (MOD-014)

تاریخ: ۱۹ اوت ۲۰۲۶ — نسخه: 1.0.0 (ساخت اولیه معماری مدولار از صفر)

## وضعیت مرزها

| مرز | وضعیت | توضیح |
| --- | --- | --- |
| بازی → engine | ✅ سالم | فقط `@bazigb/engine`؛ بدون React/NestJS/Prisma |
| سرور → بازی | ✅ سالم | فقط API عمومی (`Backgammon`, `ChessGame`, `TicTacToe`, `Vegas`, AIها) |
| وب → بازی | ✅ سالم | فقط API عمومی (قرارداد MOD-010 در DESIGN_SYSTEM.md) |
| گیتوی → منطق | ✅ تفکیکشده | `game.gateway.ts` فقط انتقال؛ منطق در `GameEngineService` (MOD-007) |

## قوانین اعمالشده در موتور

- `sanitizeMatch`: Match Point و Win by 2 فقط برای نرد و دوز — شطرنج و وگاس همیشه غیرفعال (تستشده در `packages/engine/test/rules.test.ts`)
- `applyChain`: اعتبارسنجی گامبهگام زنجیره حرکات ترکیبی در نرد/وگاس
- همه توابع بازی خالص و تغییرناپذیر

## بدهی باقیمانده (Debt)

1. **MOD-008 (کامل):** اعتبارسنجی خودکار واردات بین ماژولهای سرور (فعلاً دستی)
2. **MOD-011:** eslint-plugin-import با محدودیت واردات بازیها در CI
3. **MOD-013:** اسکریپت Change-Impact Testing بر اساس `git diff`
4. **Auth کامل:** OTP/SMS (sms.ir) و RBAC — فقط JWT مهمان فعال است
5. **Persist دیتابیس:** Prisma آماده است (`prisma/schema.prisma`) ولی runtime فعلاً فایل JSON است
6. **قوانین تکمیلی نرد:** دابلینگ کیوب، مارس/بکگمون (امتیاز ۲/۳) — فعلاً هر برد ۱ امتیاز

## استراتژی merge

- همه تغییرات روی `refactor/modular-architecture`
- پس از تأیید تستها و بیلد: merge به `main` (شاخه تولید) فقط با تأیید صریح
- دیپلوی پروداکشن: Zero Build (scripts/deploy.sh) — فقط از شاخه تأییدشده

## تستها

| پکیج | تستها |
| --- | --- |
| @bazigb/engine | قوانین مسابقه، تاس، نوبت |
| @bazigb/game-tic-tac-toe | برد/مساوی/Match Point/AI |
| @bazigb/game-backgammon | چیدمان/تاس/ضربه/زندان/برداشتن/دوبل/مسابقه |
| @bazigb/game-chess | شروع/آنپاسان/قلعه/کیش/کیشمات/ترقی/پات |
| @bazigb/game-vegas | شرط/پات/زنجیره/AI |
