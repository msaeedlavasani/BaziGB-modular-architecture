'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppLocale } from '@/hooks/useAppLocale';
import { localizedAppRoute } from '@/i18n/routing';

export default function PrivateAlphaRedirect() {
  const router = useRouter();
  const locale = useAppLocale();

  useEffect(() => {
    router.replace(localizedAppRoute(locale, 'lobby'));
  }, [locale, router]);

  return null;
}
