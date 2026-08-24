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
import { Gamepad2, Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/sound-service';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { getLanguageSwitcherMessages } from '@/i18n/language-switcher';
import { APP_ROUTES, localePath, localizedAppRoute, stripLocale } from '@/i18n/routing';

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
      { route: 'lobby' as const, href: APP_ROUTES.lobby, label: messages.navigation.lobby, icon: Gamepad2 },
      { route: 'leaderboard' as const, href: APP_ROUTES.leaderboard, label: messages.navigation.leaderboard, icon: Trophy },
      { route: 'tournaments' as const, href: APP_ROUTES.tournaments, label: messages.navigation.tournaments, icon: Swords },
    ],
    [messages],
  );

  useEffect(() => {
    setMuted(soundService.isMuted());
    return soundService.subscribe(() => setMuted(soundService.isMuted()));
  }, []);

  const circleControlSx = {
    width: { xs: 36, sm: 40 },
    height: { xs: 36, sm: 40 },
    minWidth: { xs: 36, sm: 40 },
    minHeight: { xs: 36, sm: 40 },
    p: 0,
    borderRadius: '50%',
    border: '1px solid',
    borderColor: alpha(theme.palette.primary.main, 0.2),
    color: 'text.secondary',
    flexShrink: 0,
  } as const;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        zIndex: 40,
        bgcolor: alpha(theme.palette.secondary.main, 0.92),
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{
          width: '100%',
          minHeight: { xs: 64, sm: 64 },
          px: { xs: 1.25, sm: 3, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr auto 1fr', sm: 'auto minmax(0, 1fr) auto' },
          alignItems: 'center',
          columnGap: { xs: 1, sm: 2, md: 4 },
        }}
      >
        <Link
          href={localizedAppRoute(locale, 'lobby')}
          aria-label="BaziGB"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifySelf: 'center',
            gridColumn: '2',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: 38, sm: 36 },
              height: { xs: 38, sm: 36 },
              overflow: 'hidden',
              borderRadius: 2.5,
              flexShrink: 0,
            }}
          >
            <Image src="/brand/logo-icon.png" alt="BaziGB" fill sizes="38px" style={{ objectFit: 'contain' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              marginInlineStart: 2,
              color: 'primary.main',
              fontWeight: 900,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            BaziGB
          </Typography>
        </Link>

        <Box
          component="nav"
          aria-label={messages.navigation.lobby}
          sx={{
            gridColumn: { xs: '3', sm: '2' },
            gridRow: 1,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.25, sm: 0.75, md: 1.5 },
            justifySelf: { xs: 'end', sm: 'center' },
            minWidth: 0,
          }}
        >
          {navLinks.map((link) => {
            const active = routePathname === link.href || routePathname.startsWith(`${link.href}/`);
            return (
              <Tooltip key={link.route} title={link.label}>
                <Button
                  component={Link}
                  href={localizedAppRoute(locale, link.route)}
                  startIcon={<link.icon size={19} />}
                  variant={active ? 'contained' : 'text'}
                  color={active ? 'primary' : 'inherit'}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    minWidth: { xs: 36, md: 'auto' },
                    width: { xs: 36, md: 'auto' },
                    height: { xs: 36, md: 40 },
                    px: { xs: 0, md: 2.25 },
                    py: { xs: 0, md: 1 },
                    borderRadius: { xs: '50%', md: 2.5 },
                    color: active ? 'secondary.main' : 'text.secondary',
                    columnGap: { xs: 0, md: 1.25 },
                    '& .MuiButton-startIcon': {
                      margin: 0,
                    },
                    '&:hover': {
                      color: active ? 'secondary.main' : 'primary.main',
                      bgcolor: active ? 'primary.light' : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, fontWeight: 800 }}>
                    {link.label}
                  </Box>
                </Button>
              </Tooltip>
            );
          })}
        </Box>

        <Box
          sx={{
            gridColumn: { xs: '1', sm: '3' },
            gridRow: 1,
            display: 'flex',
            alignItems: 'center',
            justifySelf: { xs: 'start', sm: 'end' },
            gap: { xs: 0.35, sm: 0.75, md: 1 },
            flexShrink: 0,
          }}
        >
          {!isAdmin && (
            <Tooltip title={languageMessages.label}>
              <Button
                component="a"
                href={alternateHref}
                aria-label={languageMessages.label}
                sx={{
                  ...circleControlSx,
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  fontSize: { xs: '0.67rem', sm: '0.72rem' },
                  lineHeight: 1,
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                  },
                }}
              >
                {languageMessages.shortLabel}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={muted ? messages.sound.enable : messages.sound.disable}>
            <IconButton
              onClick={() => soundService.toggleMute()}
              aria-label={muted ? messages.sound.enable : messages.sound.disable}
              sx={{
                ...circleControlSx,
                color: muted ? 'text.disabled' : 'primary.main',
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={messages.navigation.profile}>
            <IconButton
              component={Link}
              href={localizedAppRoute(locale, 'profile')}
              aria-current={routePathname === APP_ROUTES.profile ? 'page' : undefined}
              aria-label={messages.navigation.profile}
              sx={{
                ...circleControlSx,
                color: routePathname === APP_ROUTES.profile ? 'primary.main' : 'text.secondary',
              }}
            >
              <User size={19} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
