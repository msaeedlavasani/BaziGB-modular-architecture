'use client';

import { useRouter } from 'next/navigation';
import { MapPinOff } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/shared/EmptyState';
import { useAppLocale } from '@/hooks/useAppLocale';
import { localizedAppRoute } from '@/i18n/routing';

export default function NotFound() {
  const locale = useAppLocale();
  const router = useRouter();
  const fa = locale === 'fa';
  return (
    <PageContainer width="narrow">
      <EmptyState
        icon={<MapPinOff size={28} />}
        title={fa ? 'این صفحه پیدا نشد' : 'This page was not found'}
        description={fa ? 'ممکن است لینک قدیمی یا نادرست باشد. از لابی مسیر درست را دوباره انتخاب کنید.' : 'The link may be old or incorrect. Choose a fresh path from the Lobby.'}
        actionLabel={fa ? 'بازگشت به لابی' : 'Back to Lobby'}
        onAction={() => router.push(localizedAppRoute(locale, 'lobby'))}
      />
    </PageContainer>
  );
}
