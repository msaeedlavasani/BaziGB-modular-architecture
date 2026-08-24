import type { Locale } from './config';

export interface AuthMessages {
  checkingSession: string;
  welcome: string;
  requestSubtitle: string;
  verifySubtitle: string;
  phone: string;
  phoneRequired: string;
  phoneInvalid: string;
  requestCode: string;
  waitBeforeRetry: string;
  sendCodeError: string;
  verificationCode: string;
  verificationRequired: string;
  username: string;
  usernameRequired: string;
  usernameRule: string;
  usernameHint: string;
  verifyCodeError: string;
  resendIn: (seconds: number) => string;
  resendCode: string;
  registerAndLogin: string;
  login: string;
  editPhone: string;
}

const AUTH_MESSAGES: Record<Locale, AuthMessages> = {
  fa: {
    checkingSession: 'بررسی نشست شما…',
    welcome: 'خوش آمدید',
    requestSubtitle: 'برای شروع شماره موبایل خود را وارد کنید',
    verifySubtitle: 'کد تایید ارسال‌شده را وارد کنید',
    phone: 'شماره موبایل',
    phoneRequired: 'شماره موبایل الزامی است',
    phoneInvalid: 'شماره موبایل معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)',
    requestCode: 'دریافت کد تایید',
    waitBeforeRetry: '۶۰ ثانیه صبر کنید',
    sendCodeError: 'خطا در ارسال کد',
    verificationCode: 'کد تایید',
    verificationRequired: 'کد تایید الزامی است',
    username: 'نام کاربری (لاتین)',
    usernameRequired: 'نام کاربری الزامی است',
    usernameRule: 'نام کاربری باید ۳ تا ۲۰ کاراکتر شامل حروف و اعداد لاتین یا _ باشد',
    usernameHint: 'حروف، اعداد و _ (۳ تا ۲۰ کاراکتر)',
    verifyCodeError: 'خطا در تایید کد',
    resendIn: (seconds) => `${seconds} ثانیه تا ارسال مجدد`,
    resendCode: 'ارسال مجدد کد',
    registerAndLogin: 'ثبت‌نام و ورود',
    login: 'ورود به حساب',
    editPhone: 'ویرایش شماره موبایل',
  },
  en: {
    checkingSession: 'Checking your session…',
    welcome: 'Welcome',
    requestSubtitle: 'Enter your mobile number to get started',
    verifySubtitle: 'Enter the verification code we sent you',
    phone: 'Mobile number',
    phoneRequired: 'Mobile number is required',
    phoneInvalid: 'Enter a valid Iranian mobile number (for example 09123456789)',
    requestCode: 'Get verification code',
    waitBeforeRetry: 'Please wait 60 seconds',
    sendCodeError: 'Could not send verification code',
    verificationCode: 'Verification code',
    verificationRequired: 'Verification code is required',
    username: 'Username',
    usernameRequired: 'Username is required',
    usernameRule: 'Username must be 3–20 Latin letters, numbers, or underscores',
    usernameHint: 'Letters, numbers and _ (3–20 characters)',
    verifyCodeError: 'Could not verify the code',
    resendIn: (seconds) => `Resend in ${seconds}s`,
    resendCode: 'Resend code',
    registerAndLogin: 'Register and sign in',
    login: 'Sign in',
    editPhone: 'Edit mobile number',
  },
};

export function getAuthMessages(locale: Locale): AuthMessages {
  return AUTH_MESSAGES[locale];
}
