import type { Locale } from './config';

export interface ProfileMessages {
  loading: string;
  historyLoadError: string;
  usernameRule: string;
  profileUpdateError: string;
  currentPasswordRequired: string;
  newPasswordMin: string;
  passwordMismatch: string;
  passwordChangeError: string;
  backToLobby: string;
  adminPanel: string;
  logout: string;
  save: string;
  cancel: string;
  changed: string;
  noEmail: string;
  games: string;
  wins: string;
  losses: string;
  winRate: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordChanged: string;
  history: string;
  gameType: string;
  opponent: string;
  time: string;
  result: string;
  noGames: string;
  unknownGame: string;
  unknownOpponent: string;
  win: string;
  loss: string;
  draw: string;
  otpOnly: string;
  accountAccess: string;
  accountAccessDescription: string;
  deleteAccount: string;
  deleteAccountTitle: string;
  deleteAccountDescription: string;
  confirmDeleteAccount: string;
  deleteAccountError: string;
}

const PROFILE_MESSAGES: Record<Locale, ProfileMessages> = {
  fa: {
    loading: 'در حال بارگذاری…',
    historyLoadError: 'دریافت تاریخچه بازی‌ها با خطا مواجه شد.',
    usernameRule: 'نام کاربری باید ۳ تا ۲۰ کاراکتر لاتین باشد',
    profileUpdateError: 'خطا در بروزرسانی پروفایل',
    currentPasswordRequired: 'رمز فعلی الزامی است',
    newPasswordMin: 'رمز جدید باید حداقل ۸ کاراکتر باشد',
    passwordMismatch: 'تکرار رمز جدید مطابقت ندارد',
    passwordChangeError: 'خطا در تغییر رمز',
    backToLobby: 'بازگشت به لابی',
    adminPanel: 'پنل مدیریت',
    logout: 'خروج',
    save: 'ذخیره',
    cancel: 'انصراف',
    changed: 'تغییر کرد',
    noEmail: 'بدون ایمیل',
    games: 'بازی‌ها',
    wins: 'برد',
    losses: 'باخت',
    winRate: 'نرخ برد',
    changePassword: 'تغییر رمز عبور',
    currentPassword: 'رمز فعلی',
    newPassword: 'رمز جدید',
    confirmPassword: 'تکرار رمز جدید',
    passwordChanged: 'رمز عبور با موفقیت تغییر کرد.',
    history: 'تاریخچه بازی‌ها',
    gameType: 'نوع بازی',
    opponent: 'حریف',
    time: 'زمان',
    result: 'نتیجه',
    noGames: 'هنوز بازی ثبت نشده است.',
    unknownGame: 'بازی نامشخص',
    unknownOpponent: 'نامشخص',
    win: 'برد',
    loss: 'باخت',
    draw: 'تساوی',
    otpOnly: 'ورود امن با کد یک‌بارمصرف',
    accountAccess: 'ورود و امنیت حساب',
    accountAccessDescription: 'ورود فقط با کد یک‌بارمصرف پیامکی انجام می‌شود و نیازی به رمز عبور ندارید.',
    deleteAccount: 'حذف حساب',
    deleteAccountTitle: 'حساب شما حذف شود؟',
    deleteAccountDescription: 'شماره موبایل و اطلاعات مستقیم حساب حذف می‌شود و از حساب خارج می‌شوید. نتیجهٔ بازی‌های قبلی فقط به‌صورت ناشناس برای صحت تاریخچه باقی می‌ماند.',
    confirmDeleteAccount: 'حذف حساب من',
    deleteAccountError: 'حذف حساب ممکن نشد. دوباره تلاش کنید.',
  },
  en: {
    loading: 'Loading…',
    historyLoadError: 'Could not load game history.',
    usernameRule: 'Username must be 3–20 Latin letters, numbers, or underscores',
    profileUpdateError: 'Could not update profile',
    currentPasswordRequired: 'Current password is required',
    newPasswordMin: 'New password must be at least 8 characters',
    passwordMismatch: 'Password confirmation does not match',
    passwordChangeError: 'Could not change password',
    backToLobby: 'Back to lobby',
    adminPanel: 'Admin panel',
    logout: 'Log out',
    save: 'Save',
    cancel: 'Cancel',
    changed: 'Updated',
    noEmail: 'No email',
    games: 'Games',
    wins: 'Wins',
    losses: 'Losses',
    winRate: 'Win rate',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm new password',
    passwordChanged: 'Password changed successfully.',
    history: 'Game history',
    gameType: 'Game',
    opponent: 'Opponent',
    time: 'Time',
    result: 'Result',
    noGames: 'No games recorded yet.',
    unknownGame: 'Unknown game',
    unknownOpponent: 'Unknown',
    win: 'Win',
    loss: 'Loss',
    draw: 'Draw',
    otpOnly: 'Secure one-time-code sign-in',
    accountAccess: 'Account access and security',
    accountAccessDescription: 'You sign in only with a one-time SMS code, so there is no password to manage.',
    deleteAccount: 'Delete account',
    deleteAccountTitle: 'Delete your account?',
    deleteAccountDescription: 'Your phone number and direct account details will be removed and you will be signed out. Past game results remain only in anonymized form to preserve match history.',
    confirmDeleteAccount: 'Delete my account',
    deleteAccountError: 'Could not delete the account. Please try again.',
  },
};

export function getProfileMessages(locale: Locale): ProfileMessages {
  return PROFILE_MESSAGES[locale];
}
