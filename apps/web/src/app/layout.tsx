import type { Metadata } from 'next';
import '@fontsource-variable/vazirmatn/wght.css';
import Providers from './Providers';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { getLocaleConfig } from '../i18n/config';
import { getRequestLocale } from '../lib/request-locale';
import { SITE_URL } from '../lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = getLocaleConfig(await getRequestLocale());
  return {
    metadataBase: new URL(SITE_URL),
    title: locale.metadata.title,
    description: locale.metadata.description,
    applicationName: 'BaziGB',
    openGraph: {
      type: 'website',
      siteName: 'BaziGB',
      title: locale.metadata.title,
      description: locale.metadata.description,
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const config = getLocaleConfig(locale);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'BaziGB',
        inLanguage: ['fa', 'en'],
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'BaziGB',
        url: SITE_URL,
        logo: `${SITE_URL}/brand/logo-512.webp`,
      },
    ],
  };

  return (
    <html lang={config.htmlLang} dir={config.direction}>
      <body style={{ minHeight: '100vh', margin: 0, display: 'flex', flexDirection: 'column' }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
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
