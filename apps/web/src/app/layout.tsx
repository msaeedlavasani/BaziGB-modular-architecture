import type { Metadata } from 'next';
import { headers } from 'next/headers';
import '@fontsource-variable/vazirmatn/wght.css';
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
      <body style={{ minHeight: '100vh', margin: 0, display: 'flex', flexDirection: 'column' }}>
        <Providers direction={config.direction} fontFamily={config.fontFamily}>
          <Header locale={locale} />
          <main style={{ flex: 1, width: '100%', minWidth: 0 }}>
            {children}
          </main>
          <Footer locale={locale} />
        </Providers>
      </body>
    </html>
  );
}
