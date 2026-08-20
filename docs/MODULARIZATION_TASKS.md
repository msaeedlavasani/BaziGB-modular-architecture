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
| MOD-001 | ایجاد شاخه امن `refactor/modular-architecture` | LOW | ✅ انجام شد — شاخه پس از ادغام کامل حذف شد (2026-08-20) |
| MOD-002 | API عمومی Backgammon: `Backgammon`, `getLegalDestinations`, `canBearOff`, `getMoveHints`, `getBestMoveSequence` | LOW | ✅ انجام شد |
| MOD-003 | API عمومی Chess: `ChessGame` + تایپها | LOW | ✅ انجام شد |
| MOD-004 | API عمومی Tic-Tac-Toe: `TicTacToe`, `getBestMove` | LOW | ✅ انجام شد |
| MOD-005 | API عمومی Vegas: `Vegas` + تایپها | LOW | ✅ انجام شد |
| MOD-006 | تستهای مرزی (vitest) در هر پکیج بازی | MEDIUM | ✅ انجام شد (تست + بیلد) |
| MOD-007 | تفکیک Game Gateway → `GameEngineService` | MEDIUM | ✅ انجام شد |
| MOD-008 | تفکیک دامنههای سرور (استفاده فقط از API عمومی) | MEDIUM | ✅ انجام شد (تأیید ممیزی 2026-08-20: سرور فقط از public API پکیجها import میکند) |
| MOD-009 | Feature Folders وب: `components/{game,layout,shared}` | LOW | ✅ انجام شد |
| MOD-010 | مستندسازی قراردادهای UI | LOW | ✅ انجام شد (DESIGN_SYSTEM.md) |
| MOD-011 | Dependency Guardrails (اجرای مرز پکیج) | LOW | ✅ انجام شد (2026-08-20): `scripts/check-boundaries.mjs` — بدون وابستگی جدید، زنجیرهشده به `typecheck` |
| MOD-012 | ایزولهسازی تستها (`npm test -w <pkg>`) | LOW | ✅ انجام شد |
| MOD-013 | Change-Impact Testing | MEDIUM | ✅ انجام شد (2026-08-20): `scripts/check-impact.mjs` — تشخیص affected packages از git diff و اجرای typecheck/test |
| MOD-014 | گزارش نهایی ARCHITECTURE_REFACTOR_REPORT.md | — | ✅ انجام شد (سند تاریخی) |

## قوانین اجرا (غیرقابل تغییر)

1. تکبرنچ `main` — همه کارها روی `main`
2. هیچ دیپلویی به پروداکشن بدون تأیید صریح
3. کامیتهای کوچک و منطقی
4. بعد از هر تسک: تست مرتبط + بیلد پکیج → سپس کامیت
