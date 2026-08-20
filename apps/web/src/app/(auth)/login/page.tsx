'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import { api } from '@/lib/api';

const PHONE_RE = /^09\d{9}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * ورود فقط با شماره موبایل و کد OTP (ورود ایمیل/پسورد حذف شده است).
 * کاربر جدید بعد از دریافت کد، نام کاربری خود را انتخاب می‌کند.
 */
export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, loginWithOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isNewUser, setIsNewUser] = useState(false);
  const [timer, setTimer] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; code?: string; username?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Already authenticated -> go home
  useEffect(() => {
    if (user && !isLoading) router.replace('/');
  }, [user, isLoading, router]);

  function validatePhone(): { phone?: string } {
    const errors: { phone?: string } = {};
    if (!phone.trim()) {
      errors.phone = 'شماره موبایل الزامی است';
    } else if (!PHONE_RE.test(phone.trim())) {
      errors.phone = 'شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)';
    }
    return errors;
  }

  async function handleRequestOtp() {
    setServerError(null);
    const p = toEnglishDigits(phone.trim());
    const errors = validatePhone();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post('/auth/otp/request', { phone: p });
      setStep('verify');
      setTimer(60);
    } catch (error: any) {
      if (error.status === 429) {
        setServerError('۶۰ ثانیه صبر کنید');
      } else {
        setServerError(error.message || 'خطا در ارسال کد');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setServerError(null);

    const errors: { phone?: string; code?: string; username?: string } = {};
    if (!code.trim()) errors.code = 'کد تایید الزامی است';
    if (isNewUser && !username.trim()) {
      errors.username = 'نام کاربری الزامی است';
    } else if (isNewUser && !USERNAME_RE.test(username.trim())) {
      errors.username = 'نام کاربری باید ۳-۲۰ کاراکتر (حروف و اعداد لاتین) باشد';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const p = toEnglishDigits(phone.trim());
      const c = toEnglishDigits(code.trim());
      const res = await loginWithOtp(p, c, isNewUser ? username : undefined);
      if (res.accessToken && res.user) {
        router.replace('/');
      } else if (res.isNewUser) {
        setIsNewUser(true);
      }
    } catch (error: any) {
      setServerError(error.message || 'خطا در تایید کد');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={48} thickness={4} color="primary" />
        <Typography color="text.secondary">بررسی نشست شما...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', py: 12 }}>
      <Box sx={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mb: 2 }}>
            خوش آمدید
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {step === 'request' ? 'برای شروع شماره موبایل خود را وارد کنید' : 'کد تایید ارسال شده را وارد کنید'}
          </Typography>
        </Box>

        {serverError && (
          <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
            {serverError}
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={handleVerifyOtp}
          noValidate
          elevation={0}
          sx={{
            p: 8,
            borderRadius: 4,
            bgcolor: alpha('#0B1622', 0.6),
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
              شماره موبایل
            </Typography>
            <TextField
              fullWidth
              type="tel"
              value={phone}
              onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              disabled={step !== 'request'}
              error={!!fieldErrors.phone}
              helperText={fieldErrors.phone}
              InputProps={{
                sx: {
                  direction: 'ltr',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em'
                },
              }}
            />
          </Box>

          {step === 'request' ? (
            <Button
              fullWidth
              onClick={handleRequestOtp}
              disabled={submitting}
              variant="contained"
              size="large"
              sx={{
                py: 2,
                fontWeight: 900,
                fontSize: '1rem',
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'دریافت کد تایید'}
            </Button>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    کد تایید
                  </Typography>
                  <Button
                    size="small"
                    disabled={timer > 0 || submitting}
                    onClick={handleRequestOtp}
                    sx={{ minWidth: 0, p: 0, fontWeight: 700 }}
                  >
                    {timer > 0 ? `${timer} ثانیه تا ارسال مجدد` : 'ارسال مجدد کد'}
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  value={code}
                  onChange={(e) => setCode(toEnglishDigits(e.target.value))}
                  placeholder="------"
                  error={!!fieldErrors.code}
                  helperText={fieldErrors.code}
                  InputProps={{
                    sx: {
                      direction: 'ltr',
                      textAlign: 'center',
                      letterSpacing: 8,
                      fontWeight: 900,
                      fontSize: '1.25rem'
                    },
                  }}
                />
              </Box>

              {isNewUser && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    نام کاربری (لاتین)
                  </Typography>
                  <TextField
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. player_one"
                    error={!!fieldErrors.username}
                    helperText={fieldErrors.username || 'حروف، اعداد و _ (۳ تا ۲۰ کاراکتر)'}
                  />
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                disabled={submitting}
                variant="contained"
                size="large"
                sx={{
                  py: 2,
                  fontWeight: 900,
                  fontSize: '1rem',
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : isNewUser ? 'ثبت‌نام و ورود' : 'ورود به حساب'}
              </Button>

              <Button
                fullWidth
                variant="text"
                size="small"
                onClick={() => {
                  setStep('request');
                  setIsNewUser(false);
                  setCode('');
                  setServerError(null);
                }}
                sx={{ color: 'text.secondary', fontWeight: 600 }}
              >
                ویرایش شماره موبایل
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
