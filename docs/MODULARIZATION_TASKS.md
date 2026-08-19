# BaziGB — Modularization Task List (Phase 0.7)

گراف وابستگی تسکها:

```
MOD-001 (Branch) → MOD-002..005 (API بازیها) → MOD-006 (تستهای مرزی)
→ MOD-007 (تفکیک گیتوی) → MOD-008 (سرویسهای دامنه)
→ MOD-009 (Feature Folders) → MOD-010 (قراردادهای UI)
→ MOD-011 (گاردریل) → MOD-012 (ایزوله تست) → MOD-013 (Impact testing)
→ MOD-014 (گزارش نهایی)
```

| ID | شرح | ریسک | وضعیت |
| --- | --- | --- | --- |
| MOD-001 | ایجاد شاخه امن `refactor/modular-architecture` | LOW | ✅ انجام شد (همراه با ساخت اولیه) |
| MOD-002 | API عمومی Backgammon: `Backgammon`, `getLegalDestinations`, `canBearOff`, `getMoveHints`, `getBestMoveSequence` | LOW | ✅ انجام شد |
| MOD-003 | API عمومی Chess: `ChessGame` + تایپها | LOW | ✅ انجام شد |
| MOD-004 | API عمومی Tic-Tac-Toe: `TicTacToe`, `getBestMove` | LOW | ✅ انجام شد |
| MOD-005 | API عمومی Vegas: `Vegas` + تایپها | LOW | ✅ انجام شد |
| MOD-006 | تستهای مرزی (vitest) در هر پکیج بازی | MEDIUM | ✅ انجام شد (تست + بیلد) |
| MOD-007 | تفکیک Game Gateway → `GameEngineService` | MEDIUM | ✅ انجام شد |
| MOD-008 | تفکیک دامنههای سرور (استفاده فقط از API عمومی) | MEDIUM | 🔄 پایه انجام شد — اعتبارسنجی واردات باقی است |
| MOD-009 | Feature Folders وب: `components/{game,layout,shared}` | LOW | ✅ انجام شد |
| MOD-010 | مستندسازی قراردادهای UI | LOW | ✅ انجام شد (DESIGN_SYSTEM.md) |
| MOD-011 | Dependency Guardrails (eslint-plugin-import) | LOW | ⏳ TODO — فاز بعد |
| MOD-012 | ایزولهسازی تستها (`npm test -w <pkg>`) | LOW | ✅ انجام شد |
| MOD-013 | Change-Impact Testing | MEDIUM | ⏳ TODO — فاز بعد |
| MOD-014 | گزارش نهایی ARCHITECTURE_REFACTOR_REPORT.md | — | 🔄 در جریان |

## قوانین اجرا (غیرقابل تغییر)

1. شاخه تولید دست نمیخورد — همه کارها در `refactor/modular-architecture`
2. هیچ دیپلویی از شاخه ماژولار به پروداکشن بدون تأیید صریح
3. کامیتهای کوچک و منطقی
4. بعد از هر تسک: تست مرتبط + بیلد پکیج → سپس کامیت
