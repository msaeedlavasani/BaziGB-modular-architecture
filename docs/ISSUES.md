# BaziGB — ISSUES (مسائل شناختهشده)

## <a id="env-recovery"></a>بازیابی .env (Env Recovery)

اگر `/opt/bazigb/.env` سرور پاک شد، آن را از آخرین پیکربندی سالم بازیابی کنید:

```bash
cat > /opt/bazigb/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_TYPE=postgres
DATABASE_URL=postgres://bazigb:CHANGE_ME@db:5432/bazigb
POSTGRES_PASSWORD=CHANGE_ME
JWT_SECRET=CHANGE_ME
EOF
```

> ⚠️ مقادیر واقعی را از مدیر سیستم دریافت کنید — هرگز رازها را در git ذخیره نکنید.

## مشکلات احتمالی

| مشکل | راهحل |
| --- | --- |
| بیلد داکر روی VPS → OOM | دیپلوی Zero Build (بیلد محلی + rsync) |
| تاس اضافه در نرد (Extra Dice) | dump `room.state` → اجرای `getLegalMoves` محلی → رفع باگ در پکیج بازی (نه گیتوی) |
| برد خاکستری | `docker compose build --no-cache server web` |
| سرور در دسترس نیست (اتاق آنلاین) | بررسی `NEXT_PUBLIC_API_URL` و پورت ۳۰۰۱ |
