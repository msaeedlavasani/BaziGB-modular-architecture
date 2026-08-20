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
2. **Health:** بعد از دیپلوی: `docker ps` → انتظار `bazigb-db-1`, `bazigb-server-1`, `bazigb-web-1`, `bazigb-caddy-1` با وضعیت `Up/Healthy`.
3. **Hard Refresh (Ctrl+F5)** پس از هر دیپلوی به کاربر یادآوری شود.
4. **شاخهها:** تکبرنچ `main` — همه کارها روی `main`؛ دیپلوی فقط با تأیید صریح.

## گزارش خطاهای رایج

- **Timeout در بیلد سرور:** ۵ دقیقه صبر کنید و `docker ps` را چک کنید — دستور بیلد را تکرار نکنید.
- **برد خاکستری (Gray Board):** بیلد تمیز: `docker compose build --no-cache server web`.
