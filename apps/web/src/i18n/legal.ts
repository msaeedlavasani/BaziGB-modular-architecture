import type { Locale } from './config';

export const SUPPORT_EMAIL = 'support@bazigb.ir';
export interface LegalSection {
  title: string;
  paragraphs: string[];
  items?: string[];
}

export interface LegalDocumentContent {
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
  sections: LegalSection[];
}

interface ContactContent {
  eyebrow: string;
  title: string;
  description: string;
  onlineLabel: string;
  onlineValue: string;
  emailLabel: string;
  noPhone: string;
  helpTitle: string;
  helpItems: string[];
  messageTitle: string;
  messageItems: string[];
  notice: string;
}

const RULES: Record<Locale, LegalDocumentContent> = {
  fa: {
    eyebrow: 'اعتماد و شفافیت',
    title: 'قوانین استفاده از BaziGB',
    description: 'قواعد ساده‌ای برای یک تجربهٔ بازی امن، منصفانه و خوشایند در نسخهٔ آلفا.',
    updatedLabel: 'آخرین به‌روزرسانی: ۱ سپتامبر ۲۰۲۶',
    sections: [
      {
        title: '۱. دربارهٔ سرویس و پذیرش قوانین',
        paragraphs: [
          'BaziGB یک سرویس آنلاین بازی است که توسط تیم BaziGB ارائه می‌شود. با ساخت حساب یا استفاده از سرویس، این قوانین و سیاست حریم خصوصی را می‌پذیرید.',
          'نسخهٔ فعلی آلفا و در حال تکمیل است؛ بنابراین ممکن است قابلیت‌ها، دسترسی یا ظاهر سرویس تغییر کند یا برای نگه‌داری موقتاً متوقف شود.',
        ],
      },
      {
        title: '۲. حساب و ورود',
        paragraphs: [
          'ورود با کد یک‌بارمصرف پیامکی انجام می‌شود. مسئولیت دسترسی به شمارهٔ موبایل و محافظت از کد ورود بر عهدهٔ شماست. نام کاربری نباید موجب جعل هویت، گمراهی یا نقض حقوق دیگران شود.',
          'BaziGB حداقل سن اختصاصی تعیین نکرده است. اگر طبق قوانین محل زندگی خود اهلیت پذیرش این شرایط را ندارید، استفاده باید با اطلاع و اجازهٔ ولی یا سرپرست قانونی انجام شود.',
        ],
      },
      {
        title: '۳. بازی منصفانه و رفتار اجتماعی',
        paragraphs: ['هدف، رقابت سالم و لذت‌بخش است. در اتاق بازی، گفتگو و واکنش‌ها باید محترمانه و ایمن بمانند.'],
        items: [
          'تقلب، دست‌کاری سرویس، دورزدن محدودیت‌ها یا ایجاد اختلال برای دیگران مجاز نیست.',
          'تهدید، آزار، نفرت‌پراکنی، جعل هویت و انتشار محتوای غیرقانونی یا اطلاعات خصوصی دیگران ممنوع است.',
          'از ارسال پیام‌های تکراری، تبلیغ ناخواسته یا تلاش برای دسترسی به حساب و دستگاه دیگران خودداری کنید.',
        ],
      },
      {
        title: '۴. اتاق‌ها، قطع اتصال و نتیجهٔ بازی',
        paragraphs: [
          'در بازی آنلاین، سازندهٔ اتاق می‌تواند جلسه را پایان دهد و خروج بازیکن یا قطع اتصال ممکن است بر ادامهٔ بازی اثر بگذارد. سرویس تلاش می‌کند وضعیت را به حاضران اعلام کند و فرصت کوتاهی برای اتصال دوباره بدهد، اما حفظ همیشگی یک جلسه تضمین نمی‌شود.',
          'نتیجه‌ها و رتبه‌بندی از دادهٔ ثبت‌شدهٔ بازی محاسبه می‌شوند. در آلفا ممکن است خطا رخ دهد؛ اگر نتیجه‌ای نادرست دیدید، از راه ایمیل پشتیبانی گزارش کنید.',
        ],
      },
      {
        title: '۵. پرداخت، جایزه و مالکیت',
        paragraphs: [
          'نسخهٔ فعلی رایگان است و بازی با پول واقعی، شرط‌بندی یا جایزهٔ مالی ارائه نمی‌کند. نام، نشان، طراحی و محتوای اختصاصی BaziGB متعلق به تیم BaziGB یا صاحبان مجاز آن است و استفادهٔ تجاری بدون اجازه مجاز نیست.',
        ],
      },
      {
        title: '۶. تعلیق، حذف حساب و تغییرات',
        paragraphs: [
          'برای حفاظت از کاربران و سرویس، ممکن است دسترسی حسابی که این قوانین را نقض می‌کند محدود یا متوقف شود. شما می‌توانید از صفحهٔ پروفایل درخواست حذف حساب بدهید؛ جزئیات اثر حذف بر داده‌ها در سیاست حریم خصوصی آمده است.',
          'تغییرات مهم این قوانین با تاریخ جدید در همین صفحه منتشر می‌شود. ادامهٔ استفاده پس از انتشار، به‌معنای پذیرش نسخهٔ تازه است.',
        ],
      },
      {
        title: '۷. تماس',
        paragraphs: [`برای پرسش، گزارش تخلف یا اعتراض دربارهٔ حساب و نتیجهٔ بازی به ${SUPPORT_EMAIL} ایمیل بزنید.`],
      },
    ],
  },
  en: {
    eyebrow: 'Trust and transparency',
    title: 'BaziGB Terms of Use',
    description: 'Simple rules for a safe, fair and enjoyable game experience during Alpha.',
    updatedLabel: 'Last updated: September 1, 2026',
    sections: [
      {
        title: '1. The service and acceptance',
        paragraphs: [
          'BaziGB is an online game service provided by the BaziGB team. By creating an account or using the service, you accept these terms and the Privacy Policy.',
          'The current service is an Alpha under active development. Features, availability and presentation may change, or be temporarily interrupted for maintenance.',
        ],
      },
      {
        title: '2. Account and sign-in',
        paragraphs: [
          'Sign-in uses a one-time code sent by SMS. You are responsible for access to your mobile number and for keeping the code private. Usernames must not impersonate, mislead or infringe the rights of others.',
          'BaziGB does not set a product-specific minimum age. If local law does not allow you to accept these terms independently, use the service only with the knowledge and permission of a parent or legal guardian.',
        ],
      },
      {
        title: '3. Fair play and community conduct',
        paragraphs: ['The goal is healthy and enjoyable competition. Game-room chat and reactions must remain respectful and safe.'],
        items: [
          'Do not cheat, tamper with the service, bypass limits or disrupt other people.',
          'Threats, harassment, hate, impersonation, unlawful content and sharing another person’s private information are prohibited.',
          'Do not send repetitive messages, unsolicited promotion, or attempt to access another person’s account or device.',
        ],
      },
      {
        title: '4. Rooms, disconnection and results',
        paragraphs: [
          'In online play, a room creator may end a session, while a player leaving or losing connection may affect the game. The service attempts to inform participants and provide a short reconnection window, but preserving every session is not guaranteed.',
          'Results and rankings are calculated from recorded game data. Alpha defects can occur; report an incorrect result through the support email.',
        ],
      },
      {
        title: '5. Payments, prizes and ownership',
        paragraphs: [
          'The current version is free and does not offer real-money play, gambling or cash prizes. The BaziGB name, marks, design and original content belong to the BaziGB team or their authorized owners and may not be used commercially without permission.',
        ],
      },
      {
        title: '6. Suspension, account deletion and changes',
        paragraphs: [
          'To protect people and the service, access may be restricted or suspended when these terms are violated. You can request account deletion from Profile; the Privacy Policy explains how deletion affects retained data.',
          'Material changes will be published on this page with a new date. Continued use after publication means acceptance of the updated terms.',
        ],
      },
      {
        title: '7. Contact',
        paragraphs: [`For questions, conduct reports, or disputes about an account or game result, email ${SUPPORT_EMAIL}.`],
      },
    ],
  },
};

const PRIVACY: Record<Locale, LegalDocumentContent> = {
  fa: {
    eyebrow: 'اعتماد و شفافیت',
    title: 'سیاست حریم خصوصی BaziGB',
    description: 'توضیح روشن دربارهٔ داده‌هایی که نسخهٔ آلفا دریافت، نگه‌داری و استفاده می‌کند.',
    updatedLabel: 'آخرین به‌روزرسانی: ۱ سپتامبر ۲۰۲۶',
    sections: [
      {
        title: '۱. مسئول داده و راه تماس',
        paragraphs: [
          `تیم BaziGB مسئول رسیدگی به داده‌های این سرویس آنلاین است. برای پرسش، درخواست دسترسی یا حذف داده و گزارش مشکل حریم خصوصی با ${SUPPORT_EMAIL} تماس بگیرید. در حال حاضر راه تماس عمومی ما همین ایمیل است.`,
        ],
      },
      {
        title: '۲. چه داده‌هایی دریافت می‌کنیم؟',
        paragraphs: ['نسخهٔ فعلی فقط داده‌های لازم برای ورود، اجرای بازی و نمایش نتیجه را دریافت می‌کند.'],
        items: [
          'حساب: شمارهٔ موبایل، نام کاربری و در صورت وجود در حساب، ایمیل؛ همچنین آمار برد، باخت و امتیاز.',
          'ورود: کد یک‌بارمصرف به‌صورت هش‌شده، تعداد تلاش و زمان انقضا. کد پس از مصرف حذف می‌شود و در صورت انقضا قابل استفاده نیست.',
          'بازی: نوع بازی، شناسهٔ بازیکنان، اتاق، نتیجه، وضعیت نهایی بازی و زمان ثبت؛ این داده‌ها برای تاریخچه و رتبه‌بندی هر بازی استفاده می‌شوند.',
          'جلسهٔ زنده: شناسه‌های فنی اتصال، وضعیت حضور و جایگاه بازیکن یا تماشاگر برای ادارهٔ اتاق و اتصال دوباره.',
          'اعلان‌های حساب، اگر این قابلیت برای شما استفاده شود: عنوان، متن، نوع، وضعیت خوانده‌شدن و زمان ایجاد.',
        ],
      },
      {
        title: '۳. گفتگو، واکنش و حضور',
        paragraphs: [
          'پیام‌های گفتگو، واکنش‌های سریع و وضعیت لحظه‌ای حضور در نسخهٔ فعلی در پایگاه دادهٔ برنامه ذخیره نمی‌شوند و فقط برای اعضای همان جلسه فرستاده می‌شوند. ممکن است زیرساخت میزبانی برای امنیت و رفع خطا گزارش‌های فنی محدود و موقت تولید کند.',
        ],
      },
      {
        title: '۴. کوکی و حافظهٔ مرورگر',
        paragraphs: [
          'در حال حاضر هیچ کوکی تبلیغاتی، آمارگیری شخص ثالث یا ردیابی رفتاری نداریم. تنها کوکی سایت «bazigb-locale» است که زبان فارسی یا انگلیسی را تا یک سال به خاطر می‌سپارد و برای عملکرد ترجیح زبان استفاده می‌شود.',
        ],
        items: [
          'حافظهٔ محلی مرورگر: توکن ورود و انتخاب‌های صدا، میوت و حجم صدا.',
          'حافظهٔ همان نشست: جایگاه موقت بازیکن برای اتصال دوباره و وضعیت موقت بازی محلی یا نوبت تخته‌نرد.',
          'پاک‌کردن داده‌های سایت در تنظیمات مرورگر این اطلاعات محلی را حذف می‌کند و ممکن است باعث خروج از حساب یا از بین رفتن ادامهٔ یک بازی محلی شود.',
        ],
      },
      {
        title: '۵. چرا از داده‌ها استفاده می‌کنیم؟',
        paragraphs: [],
        items: [
          'ساخت و مدیریت حساب و ارسال کد ورود؛',
          'ساخت اتاق، اجرای بازی، اتصال دوباره و اعلام وضعیت به حاضران؛',
          'ثبت تاریخچه، محاسبهٔ نتیجه و نمایش رتبه‌بندی جداگانهٔ هر بازی؛',
          'پیشگیری از سوءاستفاده، رفع خطا و حفاظت از سرویس؛',
          'پاسخ به درخواست پشتیبانی و انجام تکالیف قانونی احتمالی.',
        ],
      },
      {
        title: '۶. چه کسانی داده را دریافت می‌کنند؟',
        paragraphs: [
          'شمارهٔ موبایل و پارامتر لازم برای ارسال کد، هنگام فعال‌بودن سرویس، به SMS.ir فرستاده می‌شود. ارائه‌دهندگان میزبانی و زیرساخت نیز ممکن است فقط به اندازهٔ لازم برای ارائه و امنیت سرویس داده را پردازش کنند. BaziGB دادهٔ شخصی را نمی‌فروشد و در نسخهٔ فعلی آن را برای تبلیغات هدفمند در اختیار دیگران نمی‌گذارد.',
        ],
      },
      {
        title: '۷. نگه‌داری و حذف',
        paragraphs: [
          'کد ورود کوتاه‌عمر است و پس از استفاده حذف می‌شود. اطلاعات حساب و تاریخچهٔ بازی تا زمانی که برای ارائهٔ سرویس، امنیت یا الزامات قانونی لازم باشد نگه‌داری می‌شوند؛ برای تاریخچهٔ بازی هنوز دورهٔ حذف ثابت تعریف نشده است.',
          'با حذف حساب از پروفایل، شناسه‌های تماس و نام کاربری قابل‌شناسایی حذف یا ناشناس می‌شوند و اعلان‌های حساب پاک می‌شوند. رکوردهای نتیجهٔ بازی ممکن است به‌صورت ناشناس برای صحت تاریخچه و رتبه‌بندی باقی بمانند.',
        ],
      },
      {
        title: '۸. انتخاب‌ها، امنیت و کودکان',
        paragraphs: [
          `می‌توانید اطلاعات قابل‌ویرایش را در پروفایل تغییر دهید، حساب را حذف کنید یا برای درخواست مربوط به داده‌ها به ${SUPPORT_EMAIL} ایمیل بزنید. هیچ سامانه‌ای کاملاً بدون خطر نیست، اما دسترسی و داده‌ها را متناسب با مرحلهٔ سرویس محدود می‌کنیم.`,
          'BaziGB مخصوص کودکان طراحی نشده و حداقل سن اختصاصی تعیین نکرده است. کاربران فاقد اهلیت قانونی باید با اطلاع و اجازهٔ ولی یا سرپرست استفاده کنند. اگر فکر می‌کنید دادهٔ فردی بدون اجازهٔ لازم ثبت شده است، با ما تماس بگیرید.',
        ],
      },
      {
        title: '۹. تغییر این سیاست',
        paragraphs: ['در صورت تغییر نوع داده، ابزار آمارگیری یا شیوهٔ استفاده، این صفحه پیش از یا هم‌زمان با فعال‌شدن آن تغییر به‌روزرسانی می‌شود. تاریخ بالای صفحه آخرین نسخه را نشان می‌دهد.'],
      },
    ],
  },
  en: {
    eyebrow: 'Trust and transparency',
    title: 'BaziGB Privacy Policy',
    description: 'A clear account of the data the Alpha receives, retains and uses.',
    updatedLabel: 'Last updated: September 1, 2026',
    sections: [
      {
        title: '1. Data contact',
        paragraphs: [
          `The BaziGB team is responsible for data handled by this online service. For privacy questions, access or deletion requests, contact ${SUPPORT_EMAIL}. This email is currently our public contact channel.`,
        ],
      },
      {
        title: '2. Data we receive',
        paragraphs: ['The current version receives only the data needed for sign-in, gameplay and results.'],
        items: [
          'Account: mobile number, username and, if present on the account, email; plus win, loss and rating statistics.',
          'Sign-in: a hashed one-time code, attempt count and expiry. The code is deleted after use and cannot be used after expiry.',
          'Games: game type, player identifiers, room, result, final state and record time, used for history and per-game rankings.',
          'Live session: technical connection identifiers, presence and player or spectator seat needed to operate the room and reconnect.',
          'Account notifications, if used for you: title, body, type, read status and creation time.',
        ],
      },
      {
        title: '3. Chat, reactions and presence',
        paragraphs: [
          'The current application does not store chat messages, quick reactions or live presence in its database; they are relayed to members of that session. Hosting infrastructure may produce limited temporary technical logs for security and troubleshooting.',
        ],
      },
      {
        title: '4. Cookies and browser storage',
        paragraphs: [
          'We currently use no advertising cookies, third-party analytics or behavioral tracking. The only site cookie is “bazigb-locale”, which remembers Persian or English for up to one year and is used as a functional language preference.',
        ],
        items: [
          'Local storage: the sign-in token and sound consent, mute and volume choices.',
          'Session storage: the temporary reconnect seat and temporary local game or Backgammon-turn state.',
          'Clearing site data in your browser removes this local information and may sign you out or prevent a local game from continuing.',
        ],
      },
      {
        title: '5. Why we use data',
        paragraphs: [],
        items: [
          'Create and manage accounts and send sign-in codes;',
          'Create rooms, run games, reconnect and show status to participants;',
          'Record history, calculate outcomes and show separate rankings for each game;',
          'Prevent abuse, troubleshoot and protect the service;',
          'Respond to support requests and meet any applicable legal duties.',
        ],
      },
      {
        title: '6. Service providers and sharing',
        paragraphs: [
          'When the SMS service is enabled, the mobile number and verification parameter are sent to SMS.ir to deliver the code. Hosting and infrastructure providers may process data only as needed to operate and secure the service. BaziGB does not sell personal data or currently share it for targeted advertising.',
        ],
      },
      {
        title: '7. Retention and deletion',
        paragraphs: [
          'Sign-in codes are short-lived and deleted after use. Account details and game history are retained while needed to provide the service, protect it, or meet applicable legal duties; no fixed deletion period has yet been set for game history.',
          'When you delete your account from Profile, identifiable contact details and the username are removed or anonymized and account notifications are deleted. Game-result records may remain in anonymized form to preserve history and ranking integrity.',
        ],
      },
      {
        title: '8. Choices, security and younger users',
        paragraphs: [
          `You can edit available profile details, delete the account, or email ${SUPPORT_EMAIL} about your data. No system is risk-free, but we limit access and collection proportionately to the service stage.`,
          'BaziGB is not specifically designed for children and does not set a product-specific minimum age. Anyone unable to accept these terms under local law should use the service only with a parent or legal guardian’s knowledge and permission. Contact us if you believe information was provided without required permission.',
        ],
      },
      {
        title: '9. Policy changes',
        paragraphs: ['If data types, analytics tools or uses change, this page will be updated before or when that change becomes active. The date above identifies the latest version.'],
      },
    ],
  },
};

const CONTACT: Record<Locale, ContactContent> = {
  fa: {
    eyebrow: 'پشتیبانی',
    title: 'تماس با تیم BaziGB',
    description: 'برای مسئله‌های حساب، بازی، ایمنی و حریم خصوصی مستقیم به ما پیام بدهید.',
    onlineLabel: 'شیوهٔ فعالیت',
    onlineValue: 'کاملاً آنلاین',
    emailLabel: 'ایمیل پشتیبانی',
    noPhone: 'در حال حاضر شمارهٔ تماس عمومی نداریم.',
    helpTitle: 'چه چیزهایی را می‌توانید گزارش کنید؟',
    helpItems: ['مشکل ورود یا حساب', 'نتیجهٔ نادرست یا اختلال بازی', 'رفتار آزاردهنده یا محتوای نامناسب', 'درخواست مربوط به حریم خصوصی یا حذف داده', 'پیشنهاد برای بهترشدن تجربهٔ بازی'],
    messageTitle: 'برای رسیدگی بهتر در ایمیل بنویسید',
    messageItems: ['نام کاربری و موضوع مشکل', 'نام بازی و کد اتاق، اگر مرتبط است', 'زمان تقریبی رخداد و شرح کوتاه', 'تصویر صفحه، فقط اگر حاوی اطلاعات حساس دیگران نیست'],
    notice: 'کد یک‌بارمصرف، رمز یا اطلاعات حساس خود را برای پشتیبانی نفرستید. پاسخ‌گویی در آلفا ممکن است فوری نباشد، اما پیام‌ها بررسی می‌شوند.',
  },
  en: {
    eyebrow: 'Support',
    title: 'Contact the BaziGB team',
    description: 'Message us directly about accounts, games, safety and privacy.',
    onlineLabel: 'How we operate',
    onlineValue: 'Online only',
    emailLabel: 'Support email',
    noPhone: 'We do not currently have a public phone number.',
    helpTitle: 'What can you report?',
    helpItems: ['Sign-in or account trouble', 'An incorrect result or game failure', 'Harassment or inappropriate content', 'A privacy or data-deletion request', 'Suggestions to improve the game experience'],
    messageTitle: 'Include these details when useful',
    messageItems: ['Your username and the issue subject', 'Game name and room code, if relevant', 'Approximate time and a short description', 'A screenshot only if it contains no sensitive information about others'],
    notice: 'Never send a one-time code, password or other secret to support. Alpha replies may not be immediate, but messages will be reviewed.',
  },
};

export function getRulesContent(locale: Locale): LegalDocumentContent {
  return RULES[locale];
}

export function getPrivacyContent(locale: Locale): LegalDocumentContent {
  return PRIVACY[locale];
}

export function getContactContent(locale: Locale): ContactContent {
  return CONTACT[locale];
}
