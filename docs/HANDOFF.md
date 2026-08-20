# BaziGB — HANDOFF (تحویل نسخه)

## نسخه فعلی

- **نسخه:** 1.0.0 — ساخت اولیه معماری مدولار (ماژولارسازی کامل از صفر)
- **تاریخ:** ۱۹ اوت ۲۰۲۶
- **شاخه:** `main` (تکبرنچ — توسعه و تولید روی یک شاخه)

## اجرای محلی

```bash
npm install
npm run build        # بیلد همه پکیجها
npm test             # تستهای واحد
npm run dev          # وب:3000 + سرور:3001
```

## دیپلوی (Zero Build)

```bash
./scripts/deploy.sh
```

مراحل: بیلد محلی → rsync به `root@193.151.153.204:/opt/bazigb/` → بررسی آرتیفکتها → ریاستارت سرویسها.

## نکات عملیاتی

1. **محافظ `.env`:** همیشه قبل از هر کاری بررسی کنید `/opt/bazigb/.env` سرور موجود است (بازیابی: `docs/ISSUES.md#env-recovery`).
2. **Health:** بعد از دیپلوی: `systemctl status bazigb-server bazigb-web` → هر دو `active (running)`؛ و `curl -s http://localhost:3001/api/rooms` پاسخ دهد.
3. **Hard Refresh (Ctrl+F5)** پس از هر دیپلوی به کاربر یادآوری شود.
4. **شاخهها:** تکبرنچ `main` — همه کارها روی `main`؛ دیپلوی فقط با تأیید صریح.

## بکاپ دیتابیس

- **مسیر بکاپ‌ها:** `/opt/bazigb/backups/`
- **فرکانس:** روزانه ساعت 03:00 بامداد (توسط `systemd timer`).
- **مدت نگهداری (Retention):** ۷ روز.
- **نحوه بازیابی:**
  1. توقف سرویس: `systemctl stop bazigb-server`
  2. جایگزینی فایل دیتابیس: `cp /opt/bazigb/backups/dev-YYYYmmdd-HHMM.db /opt/bazigb/apps/server/prisma/dev.db`
  3. شروع مجدد: `systemctl start bazigb-server`
