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
import { Gamepad2, Languages, Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
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
          gap: { xs: 0.5, sm: 2, md: 4 },
          minHeight: { xs: 58, sm: 64 },
          px: { xs: 1, sm: 3, md: 6 },
        }}
      >
        <Link
          href={localizedAppRoute(locale, 'lobby')}
          aria-label="BaziGB"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
        >
          <Box
            sx={{
              position: 'relative',
              width: { xs: 30, sm: 36 },
              height: { xs: 30, sm: 36 },
              overflow: 'hidden',
              borderRadius: 2.5,
              flexShrink: 0,
            }}
          >
            <Image src="/brand/logo-icon.png" alt="BaziGB" fill sizes="36px" style={{ objectFit: 'contain' }} />
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
            display: 'flex',
            gap: { xs: 0.25, sm: 0.75, md: 2 },
            flexGrow: 1,
            justifyContent: 'center',
            minWidth: 0,
          }}
        >
          {navLinks.map((link) => {
            const active = routePathname === link.href || routePathname.startsWith(`${link.href}/`);
            return (
              <Tooltip key={link.route} title={link.label} disableHoverListener={false}>
                <Button
                  component={Link}
                  href={localizedAppRoute(locale, link.route)}
                  startIcon={<link.icon size={19} />}
                  variant={active ? 'contained' : 'text'}
                  color={active ? 'primary' : 'inherit'}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    minWidth: { xs: 34, sm: 40, md: 'auto' },
                    minHeight: { xs: 34, sm: 40 },
                    px: { xs: 0.75, sm: 1.25, md: 3 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 2.5,
                    color: active ? 'secondary.main' : 'text.secondary',
                    '& .MuiButton-startIcon': {
                      marginInlineEnd: { xs: 0, md: 1.5 },
                      marginInlineStart: 0,
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.75, md: 1.5 }, flexShrink: 0 }}>
          {!isAdmin && (
            <Tooltip title={languageMessages.label}>
              <Button
                component={Link}
                href={alternateHref}
                aria-label={languageMessages.label}
                startIcon={<Languages size={17} />}
                variant="outlined"
                sx={{
                  minWidth: { xs: 34, sm: 66 },
                  minHeight: { xs: 34, sm: 40 },
                  px: { xs: 0.75, sm: 1.5 },
                  py: { xs: 0.5, sm: 1 },
                  borderColor: alpha(theme.palette.primary.main, 0.22),
                  color: 'text.secondary',
                  fontWeight: 900,
                  letterSpacing: '0.03em',
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'inherit' },
                    marginInlineEnd: 0.75,
                    marginInlineStart: 0,
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
                width: { xs: 34, sm: 40 },
                height: { xs: 34, sm: 40 },
                color: muted ? 'text.disabled' : 'primary.main',
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.15),
              }}
            >
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </IconButton>
          </Tooltip>

          <Tooltip title={messages.navigation.profile}>
            <Button
              component={Link}
              href={localizedAppRoute(locale, 'profile')}
              startIcon={<User size={19} />}
              aria-current={routePathname === APP_ROUTES.profile ? 'page' : undefined}
              sx={{
                minWidth: { xs: 34, sm: 'auto' },
                minHeight: { xs: 34, sm: 40 },
                color: routePathname === APP_ROUTES.profile ? 'primary.main' : 'text.secondary',
                px: { xs: 0.75, sm: 1.5, md: 2.5 },
                py: { xs: 0.75, sm: 1 },
                borderRadius: 2.5,
                fontWeight: 800,
                '& .MuiButton-startIcon': {
                  marginInlineEnd: { xs: 0, sm: 1.5 },
                  marginInlineStart: 0,
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                {messages.navigation.profile}
              </Box>
            </Button>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
