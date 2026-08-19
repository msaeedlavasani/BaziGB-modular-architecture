'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Link as MuiLink,
  Tabs,
  Tab,
} from '@mui/material';
import { api } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^09\d{9}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

interface FormErrors {
  email?: string;
  password?: string;
  phone?: string;
  code?: string;
  username?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading, login, loginWithOtp } = useAuth();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  
  // Email mode state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone mode state
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isNewUser, setIsNewUser] = useState(false);
  const [timer, setTimer] = useState(0);

  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
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

  function validateEmail(): FormErrors {
    const errors: FormErrors = {};
    if (!email.trim()) {
      errors.email = 'ایمیل الزامی است';
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = 'ایمیل وارد شده معتبر نیست';
    }
    if (!password) {
      errors.password = 'رمز عبور الزامی است';
    }
    return errors;
  }

  function validatePhone(): FormErrors {
    const errors: FormErrors = {};
    if (!phone.trim()) {
      errors.phone = 'شماره موبایل الزامی است';
    } else if (!PHONE_RE.test(phone.trim())) {
      errors.phone = 'شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)';
    }
    return errors;
  }

  async function handleRequestOtp() {
    setServerError(null);
    const errors = validatePhone();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await api.post('/auth/otp/request', { phone });
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
    
    const errors: FormErrors = {};
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
      const res = await loginWithOtp(phone, code, isNewUser ? username : undefined);
      if (res.isNewUser && !isNewUser) {
        setIsNewUser(true);
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      setServerError(error.message || 'خطا در تایید کد');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const errors = validateEmail();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (error: unknown) {
      setServerError(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={48} thickness={4} color="primary" />
        <Typography color="text.secondary">Checking your session...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Tabs
        value={mode}
        onChange={(_, newValue) => {
          setMode(newValue);
          setServerError(null);
          setFieldErrors({});
        }}
        variant="fullWidth"
        sx={{
          mb: 1,
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            background: '#F5A306',
          },
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: 'primary.light',
            },
          },
        }}
      >
        <Tab label="ایمیل" value="email" />
        <Tab label="شماره موبایل" value="phone" />
      </Tabs>

      {serverError && (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
          {serverError}
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={mode === 'email' ? handleEmailSubmit : handleVerifyOtp}
        noValidate
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          bgcolor: 'rgba(11, 22, 34, 0.6)',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          direction: mode === 'phone' ? 'rtl' : 'ltr',
        }}
      >
        {mode === 'email' ? (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                Email
              </Typography>
              <TextField
                fullWidth
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                variant="outlined"
                size="small"
                InputProps={{
                  sx: {
                    sx: {
                      bgcolor: 'rgba(3, 10, 21, 0.6)',
                      borderRadius: 2,
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                Password
              </Typography>
              <TextField
                fullWidth
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                variant="outlined"
                size="small"
                InputProps={{
                  sx: {
                    sx: {
                      bgcolor: 'rgba(3, 10, 21, 0.6)',
                      borderRadius: 2,
                    },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              disabled={submitting}
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                background: '#F5A306',
                '&:hover': {
                  background: '#B25D16',
                },
              }}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                شماره موبایل
              </Typography>
              <TextField
                fullWidth
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                disabled={step !== 'request'}
                error={!!fieldErrors.phone}
                helperText={fieldErrors.phone}
                variant="outlined"
                size="small"
                InputProps={{
                  sx: {
                    sx: {
                      bgcolor: 'rgba(3, 10, 21, 0.6)',
                      borderRadius: 2,
                      direction: 'ltr',
                    },
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
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: 2,
                  background: '#F5A306',
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'دریافت کد تایید'}
              </Button>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                      کد تایید
                    </Typography>
                    <Button
                      size="small"
                      disabled={timer > 0 || submitting}
                      onClick={handleRequestOtp}
                      sx={{ minWidth: 0, p: 0 }}
                    >
                      {timer > 0 ? `${timer} ثانیه` : 'ارسال مجدد'}
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="------"
                    error={!!fieldErrors.code}
                    helperText={fieldErrors.code}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      sx: {
                        sx: {
                          bgcolor: 'rgba(3, 10, 21, 0.6)',
                          borderRadius: 2,
                          textAlign: 'center',
                          letterSpacing: 4,
                          direction: 'ltr',
                        },
                      },
                    }}
                  />
                </Box>

                {isNewUser && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} color="text.secondary">
                      نام کاربری (لاتین)
                    </Typography>
                    <TextField
                      fullWidth
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. boardmaster"
                      error={!!fieldErrors.username}
                      helperText={fieldErrors.username || 'فقط حروف انگلیسی، اعداد و _'}
                      variant="outlined"
                      size="small"
                      InputProps={{
                        sx: {
                          sx: {
                            bgcolor: 'rgba(3, 10, 21, 0.6)',
                            borderRadius: 2,
                            direction: 'ltr',
                          },
                        },
                      }}
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
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 2,
                    background: '#F5A306',
                  }}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : isNewUser ? 'ثبت‌نام و ورود' : 'ورود'}
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
                  sx={{ color: 'text.secondary' }}
                >
                  تغییر شماره موبایل
                </Button>
              </>
            )}
          </>
        )}
      </Paper>

      <Typography variant="body2" align="center" color="text.secondary">
        Don&apos;t have an account?{' '}
        <MuiLink
          component={Link}
          href="/register"
          underline="hover"
          sx={{ fontWeight: 600 }}
          color="primary.light"
        >
          Create one
        </MuiLink>
      </Typography>
    </Box>
  );
}
