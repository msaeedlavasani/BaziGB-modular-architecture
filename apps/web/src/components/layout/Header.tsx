'use client';

import { useEffect, useMemo, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/sound-service';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { getLanguageSwitcherMessages } from '@/i18n/language-switcher';
import { APP_ROUTES, localePath, localizedAppRoute, stripLocale } from '@/i18n/routing';
import { PRIVATE_ALPHA_HIDDEN_PATHS } from '@/lib/private-alpha';
import { layoutContract } from '@/design-system/layout-contract';
import NavigationItem from './NavigationItem';

interface HeaderProps {
  locale?: Locale;
}

export default function Header({ locale = 'fa' }: HeaderProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);
  const messages = getMessages(locale);
  const languageMessages = getLanguageSwitcherMessages(locale);
  const routePathname = stripLocale(pathname).pathname;
  const alternateLocale: Locale = locale === 'fa' ? 'en' : 'fa';
  const alternateHref = localePath(alternateLocale, routePathname);
  const isAdmin = routePathname === APP_ROUTES.admin || routePathname.startsWith(`${APP_ROUTES.admin}/`);

  const navLinks = useMemo(
    () => [
      { route: 'leaderboard' as const, href: APP_ROUTES.leaderboard, label: messages.navigation.leaderboard, icon: Trophy },
      { route: 'tournaments' as const, href: APP_ROUTES.tournaments, label: messages.navigation.tournaments, icon: Swords },
    ],
    [messages],
  );

  useEffect(() => {
    setMuted(soundService.isMuted());
    return soundService.subscribe(() => setMuted(soundService.isMuted()));
  }, []);

  const controlButtonSx = {
    width: { xs: 36, sm: 40 },
    height: { xs: 36, sm: 40 },
    minWidth: { xs: 36, sm: 40 },
    minHeight: { xs: 36, sm: 40 },
    p: 0,
    borderRadius: 2,
    color: 'text.secondary',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  } as const;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100%',
        zIndex: 40,
        bgcolor: alpha(theme.palette.secondary.main, 0.96),
        backdropFilter: 'blur(10px)',
        border: 0,
        borderBottom: '1px solid',
        borderBottomColor: 'divider',
        borderRadius: 0,
        overflowX: 'clip',
        boxSizing: 'border-box',
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          width: '100%',
          maxWidth: 'lg',
          minHeight: { xs: 64, md: 68 },
          mx: 'auto',
          px: layoutContract.page.inlineGutter,
          boxSizing: 'border-box',
          direction: theme.direction,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          component="nav"
          aria-label={messages.navigation.lobby}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: { xs: 0.5, md: 1 },
          }}
        >
          {navLinks.filter((link) => !PRIVATE_ALPHA_HIDDEN_PATHS.has(link.href)).map((link) => {
            const active = routePathname === link.href || routePathname.startsWith(`${link.href}/`);
            return (
              <Tooltip key={link.route} title={link.label}>
                <Box component="span" sx={{ display: 'inline-flex' }}>
                  <NavigationItem
                    href={localizedAppRoute(locale, link.route)}
                    label={link.label}
                    icon={<link.icon size={19} />}
                    active={active}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Link
          href={localizedAppRoute(locale, 'lobby')}
          aria-label="BaziGB"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: 36, md: 34 },
              height: { xs: 36, md: 34 },
              flexShrink: 0,
            }}
          >
            <Image src="/brand/logo-icon.png" alt="BaziGB" fill sizes="38px" style={{ objectFit: 'contain' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              marginInlineStart: 1.5,
              color: 'primary.main',
              fontWeight: 900,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              display: { xs: 'none', md: 'block' },
            }}
          >
            BaziGB
          </Typography>
        </Link>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            direction: 'ltr',
          }}
        >
          <Box
            role="group"
            aria-label={messages.navigation.profile}
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 0.25,
              gap: 0.25,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.22),
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.background.paper, 0.36),
            }}
          >
            <Tooltip title={messages.navigation.profile}>
              <IconButton
                component={Link}
                href={localizedAppRoute(locale, 'profile')}
                aria-current={routePathname === APP_ROUTES.profile ? 'page' : undefined}
                aria-label={messages.navigation.profile}
                sx={{
                  ...controlButtonSx,
                  color: routePathname === APP_ROUTES.profile ? 'primary.main' : 'text.secondary',
                }}
              >
                <User size={19} />
              </IconButton>
            </Tooltip>

            <Tooltip title={muted ? messages.sound.enable : messages.sound.disable}>
              <IconButton
                onClick={() => soundService.toggleMute()}
                aria-label={muted ? messages.sound.enable : messages.sound.disable}
                sx={{
                  ...controlButtonSx,
                  color: muted ? 'text.disabled' : 'primary.main',
                }}
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </IconButton>
            </Tooltip>

            {!isAdmin && (
              <Tooltip title={languageMessages.label}>
                <Button
                  component="a"
                  href={alternateHref}
                  aria-label={languageMessages.label}
                  sx={{
                    ...controlButtonSx,
                    fontWeight: 900,
                    letterSpacing: 0,
                    fontSize: { xs: '0.72rem', sm: '0.75rem' },
                    textAlign: 'center',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                    },
                  }}
                >
                  {languageMessages.shortLabel}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
