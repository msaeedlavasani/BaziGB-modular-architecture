# BaziGB — ISSUES (مسائل شناختهشده)

## <a id="env-recovery"></a>بازیابی .env (Env Recovery)

اگر `/opt/bazigb/.env` سرور پاک شد، آن را از آخرین پیکربندی سالم بازیابی کنید:

```bash
cat > /opt/bazigb/.env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=CHANGE_ME
SMSIR_API_KEY=CHANGE_ME
SMSIR_TEMPLATE_ID=997360
EOF
```

> دیتابیس فعلی SQLite است (Prisma، مسیر `file:./dev.db` در schema) — متغیر دیتابیس لازم نیست.
> ⚠️ مقادیر واقعی را از مدیر سیستم دریافت کنید — هرگز رازها را در git ذخیره نکنید.

## مشکلات احتمالی

| مشکل | راهحل |
| --- | --- |
| بیلد داکر روی VPS → OOM | دیپلوی Zero Build (بیلد محلی + rsync) |
| تاس اضافه در نرد (Extra Dice) | dump `room.state` → اجرای `getLegalMoves` محلی → رفع باگ در پکیج بازی (نه گیتوی) |
| برد خاکستری | Hard Refresh (Ctrl+F5)؛ در صورت تداوم: `systemctl restart bazigb-web` + بررسی `journalctl -u bazigb-web -n 50` |
| سرور در دسترس نیست (اتاق آنلاین) | بررسی `NEXT_PUBLIC_API_URL` و پورت ۳۰۰۱ |
