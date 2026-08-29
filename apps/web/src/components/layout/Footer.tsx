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
import { localePath, localizedAppRoute, stripLocale } from '@/i18n/routing';
import TrustSeal from './TrustSeal';

interface FooterProps {
  locale?: Locale;
}

function localizeManagedHref(locale: Locale, href: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  if (stripLocale(href).locale) return href;
  if (href === '/admin' || href.startsWith('/admin/')) return href;
  return localePath(locale, href);
}

/** Global BaziGB footer. Managed copy and shell labels are locale-aware. */
export default function Footer({ locale = 'fa' }: FooterProps) {
  const [footer, setFooter] = useState<FooterContent>(FOOTER_DEFAULTS_BY_LOCALE[locale]);
  const messages = getMessages(locale);
  const excludedShellHrefs = new Set(['/lobby', '/leaderboard', '/tournaments']);
  const managedLinks = (footer.links ?? []).filter(
    (link) => !excludedShellHrefs.has(stripLocale(link.href).pathname),
  );

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
        py: 'clamp(1rem, 3dvb, 2rem)',
      }}
    >
      <Container maxWidth="lg" sx={{ containerType: 'inline-size' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gridTemplateAreas: '"brand" "legal" "trust"',
            alignItems: 'center',
            gap: 'clamp(1rem, 4vw, 2.5rem)',
            direction: locale === 'fa' ? 'rtl' : 'ltr',
            '@container (min-width: 42rem)': {
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gridTemplateAreas: '"brand brand" "legal trust"',
            },
            '@container (min-width: 64rem)': {
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gridTemplateAreas: '"brand legal trust"',
            },
          }}
        >
          <Box sx={{ gridArea: 'brand', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                component={Link}
                href={localizedAppRoute(locale, 'lobby')}
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

          <Box sx={{ gridArea: 'legal', display: 'flex', flexWrap: 'wrap', columnGap: 'clamp(1rem, 3vw, 2rem)', rowGap: 1, justifyContent: 'center' }}>
            {managedLinks.map((link) => (
              <Typography
                key={`${link.label}-${link.href}`}
                component={Link}
                href={localizeManagedHref(locale, link.href)}
                variant="subtitle2"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
              >
                {link.label}
              </Typography>
            ))}
            <Typography
              component={Link}
              href={localizedAppRoute(locale, 'rules')}
              variant="subtitle2"
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {messages.footer.rules}
            </Typography>
            <Typography
              component={Link}
              href={localizedAppRoute(locale, 'privacy')}
              variant="subtitle2"
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {messages.footer.privacy}
            </Typography>
            <Typography
              component={Link}
              href={localizedAppRoute(locale, 'contact')}
              variant="subtitle2"
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {messages.footer.contact}
            </Typography>
          </Box>

          <Box sx={{ gridArea: 'trust', justifySelf: 'center' }}>
            <TrustSeal locale={locale} />
          </Box>
        </Box>

        <Divider sx={{ my: 'clamp(0.75rem, 2dvb, 1rem)', borderColor: 'divider', opacity: 0.5 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', opacity: 0.6 }}>
            {footer.copyright}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
