'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Container, Divider, Typography, alpha } from '@mui/material';
import { honeyBronze } from '@/theme';
import {
  fetchSiteSettings,
  FooterContent,
  FOOTER_DEFAULTS_BY_LOCALE,
} from '@/lib/site-settings';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { APP_ROUTES } from '@/i18n/routing';

interface FooterProps {
  locale?: Locale;
}

/** Global BaziGB footer. Managed copy and shell labels are locale-aware. */
export default function Footer({ locale = 'fa' }: FooterProps) {
  const [footer, setFooter] = useState<FooterContent>(FOOTER_DEFAULTS_BY_LOCALE[locale]);
  const messages = getMessages(locale);

  useEffect(() => {
    let cancelled = false;
    setFooter(FOOTER_DEFAULTS_BY_LOCALE[locale]);
    fetchSiteSettings(locale).then(({ footer: f }) => {
      if (!cancelled && f) setFooter(f);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(honeyBronze.secondary, 0.95),
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', sm: 'flex-start' }, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                component={Link}
                href={APP_ROUTES.lobby}
                sx={{ fontSize: '1.5rem', fontWeight: 900, color: 'primary.main', textDecoration: 'none' }}
              >
                BaziGB
              </Typography>
              <Image src="/brand/logo-icon.png" alt="Logo" width={32} height={32} style={{ borderRadius: 8 }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {footer.tagline}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {(footer.links?.length > 0 ? footer.links : []).map((link) => (
              <Typography
                key={`${link.label}-${link.href}`}
                component={Link}
                href={link.href}
                variant="subtitle2"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.label}
              </Typography>
            ))}
            <Typography component={Link} href={APP_ROUTES.rules} variant="subtitle2" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              {messages.footer.rules}
            </Typography>
            <Typography component={Link} href={APP_ROUTES.contact} variant="subtitle2" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
              {messages.footer.contact}
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.3)', borderColor: alpha(honeyBronze.primary, 0.4) },
              '& img': { display: 'block', filter: 'grayscale(0.4) contrast(0.9)', transition: 'filter 0.3s' },
              '&:hover img': { filter: 'grayscale(0) contrast(1)' },
            }}
          >
            <a
              referrerPolicy="origin"
              target="_blank"
              rel="noreferrer"
              href="https://trustseal.enamad.ir/?id=7267311&Code=gFXuwV2xlgp1rBZVgH6aae2Vp4ynU4S6"
            >
              <img
                referrerPolicy="origin"
                src="https://trustseal.enamad.ir/logo.aspx?id=7267311&Code=gFXuwV2xlgp1rBZVgH6aae2Vp4ynU4S6"
                alt="eNamad"
                style={{ height: 48, width: 'auto', cursor: 'pointer' }}
              />
            </a>
          </Box>
        </Box>

        <Divider sx={{ my: 6, borderColor: 'divider', opacity: 0.5 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', opacity: 0.6 }}>
            {footer.copyright}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
