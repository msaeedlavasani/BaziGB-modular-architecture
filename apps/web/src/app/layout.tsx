import type { Metadata } from 'next';
import Providers from './Providers';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { DEFAULT_LOCALE, getLocaleConfig } from '../i18n/config';

const defaultLocale = getLocaleConfig(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: defaultLocale.metadata.title,
  description: defaultLocale.metadata.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale.htmlLang} dir={defaultLocale.direction}>
      <head>
        {/* Persian-first fallback until locale-scoped layouts are introduced. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap"
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers direction={defaultLocale.direction} fontFamily={defaultLocale.fontFamily}>
          <Header />
          <main style={{ flex: 1, width: '100%', maxWidth: 1200, margin: '0 auto', padding: '16px' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
