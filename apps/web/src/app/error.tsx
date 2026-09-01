'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import PageContainer from '@/components/layout/PageContainer';
import EmptyState from '@/components/shared/EmptyState';
import { useAppLocale } from '@/hooks/useAppLocale';
import { localizedAppRoute } from '@/i18n/routing';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useAppLocale();
  const router = useRouter();
  const fa = locale === 'fa';

  useEffect(() => {
    // Keep the digest available to local/server logging without exposing stack details to users.
    console.error('BaziGB route error', error.digest ?? error.message);
  }, [error]);

  return (
    <PageContainer width="narrow">
      <EmptyState
        icon={<RefreshCw size={28} />}
        title={fa ? 'این بخش موقتاً در دسترس نیست' : 'This section is temporarily unavailable'}
        description={fa ? 'اطلاعات شما عمداً تغییر داده نشده است. دوباره تلاش کنید یا به لابی برگردید.' : 'Your data was not intentionally changed. Try again or return to the Lobby.'}
      />
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={reset}>{fa ? 'تلاش دوباره' : 'Try again'}</Button>
        <Button variant="outlined" onClick={() => router.push(localizedAppRoute(locale, 'lobby'))}>{fa ? 'لابی' : 'Lobby'}</Button>
      </Box>
      {process.env.NODE_ENV === 'development' && error.digest && <Alert severity="info" sx={{ mt: 2 }}>ID: {error.digest}</Alert>}
    </PageContainer>
  );
}
