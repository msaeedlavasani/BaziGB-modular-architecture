import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Providers from './Providers';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { DEFAULT_LOCALE, getLocaleConfig, isLocale, type Locale } from '../i18n/config';

const LOCALE_HEADER = 'x-bazigb-locale';

function getRequestLocale(): Locale {
  const value = headers().get(LOCALE_HEADER);
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function generateMetadata(): Metadata {
  const locale = getLocaleConfig(getRequestLocale());
  return {
    title: locale.metadata.title,
    description: locale.metadata.description,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getRequestLocale();
  const config = getLocaleConfig(locale);

  return (
    <html lang={config.htmlLang} dir={config.direction}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap"
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers direction={config.direction} fontFamily={config.fontFamily}>
          <Header locale={locale} />
          <main style={{ flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '16px' }}>
            {children}
          </main>
          <Footer locale={locale} />
        </Providers>
      </body>
    </html>
  );
}
