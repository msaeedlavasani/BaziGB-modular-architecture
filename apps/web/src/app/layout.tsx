import type { Metadata } from 'next';
import Providers from './Providers';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'BaziGB — نرد، دوز، شطرنج و وگاس',
  description: 'پلتفرم بازی‌های ایرانی با معماری مدولار',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        {/* فونت وزیرمتن — در صورت عدم دسترسی، فونت جایگزین Tahoma استفاده می‌شود */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800&display=swap"
        />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
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
