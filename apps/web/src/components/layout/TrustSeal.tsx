'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ShieldCheck } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const trustHref = 'https://trustseal.enamad.ir/?id=7267311&Code=gFXuwV2xlgp1rBZVgH6aae2Vp4ynU4S6';
const trustImage = 'https://trustseal.enamad.ir/logo.aspx?id=7267311&Code=gFXuwV2xlgp1rBZVgH6aae2Vp4ynU4S6';

/** Remote trust seal with an honest, non-broken verification-link fallback. */
export default function TrustSeal({ locale }: { locale: Locale }) {
  const [loaded, setLoaded] = useState(false);
  const label = locale === 'fa' ? 'استعلام اینماد' : 'Verify eNamad';

  return (
    <Box
      component="a"
      href={trustHref}
      target="_blank"
      rel="noreferrer"
      referrerPolicy="origin"
      aria-label={label}
      sx={{
        inlineSize: 116,
        minBlockSize: 72,
        px: 1.5,
        py: 1,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'rgba(0,0,0,0.2)',
        color: 'text.secondary',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': { color: 'primary.main', borderColor: 'primary.dark' },
      }}
    >
      {!loaded && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, textAlign: 'center' }}>
          <ShieldCheck size={24} />
          <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
            {label}
          </Typography>
        </Box>
      )}
      <Box
        component="img"
        src={trustImage}
        alt="eNamad"
        referrerPolicy="origin"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        sx={{ display: loaded ? 'block' : 'none', maxInlineSize: '100%', blockSize: 52, objectFit: 'contain' }}
      />
    </Box>
  );
}
