'use client';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Languages, Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/sound-service';
import { honeyBronze } from '@/theme';
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
    const unsub = soundService.subscribe(() => setMuted(soundService.isMuted()));
    return unsub;
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
      <Toolbar sx={{ gap: { xs: 1.5, sm: 4 }, minHeight: 64, px: { xs: 2, sm: 6 } }}>
        <Link
          href={localizedAppRoute(locale, 'lobby')}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: theme.spacing(2) }}
        >
          <Box sx={{ position: 'relative', width: 36, height: 36, overflow: 'hidden', borderRadius: 2.5, flexShrink: 0 }}>
            <Image src="/brand/logo-icon.png" alt="BaziGB Logo" fill sizes="36px" style={{ objectFit: 'contain' }} />
          </Box>
          <Typography
            variant="h5"
            sx={{
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

        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 2 }, flexGrow: 1, justifyContent: 'center', minWidth: 0 }}>
          {navLinks.map((link) => {
            const active = routePathname === link.href || routePathname.startsWith(`${link.href}/`);
            return (
              <Button
                key={link.route}
                component={Link}
                href={localizedAppRoute(locale, link.route)}
                startIcon={<link.icon size={20} />}
                variant={active ? 'contained' : 'text'}
                color={active ? 'primary' : 'inherit'}
                sx={{
                  minWidth: { xs: 42, md: 'auto' },
                  px: { xs: 1.25, sm: 3, md: 4 },
                  py: 1.25,
                  borderRadius: 3,
                  color: active ? 'secondary.main' : 'text.secondary',
                  '& .MuiButton-startIcon': {
                    marginInlineEnd: { xs: 0, md: 2 },
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
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 2 } }}>
          {!isAdmin && (
            <Tooltip title={languageMessages.label}>
              <Button
                component={Link}
                href={alternateHref}
                aria-label={languageMessages.label}
                startIcon={<Languages size={18} />}
                variant="outlined"
                sx={{
                  minWidth: { xs: 42, sm: 72 },
                  px: { xs: 1, sm: 2 },
                  borderColor: alpha(theme.palette.primary.main, 0.22),
                  color: 'text.secondary',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  '& .MuiButton-startIcon': {
                    display: { xs: 'none', sm: 'inherit' },
                    marginInlineEnd: 1,
                    marginInlineStart: 0,
                  },
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {languageMessages.shortLabel}
              </Button>
            </Tooltip>
          )}

          <IconButton
            onClick={() => soundService.toggleMute()}
            aria-label={muted ? messages.sound.enable : messages.sound.disable}
            sx={{
              color: muted ? 'text.disabled' : 'primary.main',
              border: '1px solid',
              borderColor: alpha(honeyBronze.primary, 0.15),
            }}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </IconButton>

          <Button
            component={Link}
            href={localizedAppRoute(locale, 'profile')}
            startIcon={<User size={20} />}
            sx={{
              minWidth: { xs: 42, sm: 'auto' },
              color: routePathname === APP_ROUTES.profile ? 'primary.main' : 'text.secondary',
              px: { xs: 1, sm: 3 },
              borderRadius: 3,
              fontWeight: 800,
              '& .MuiButton-startIcon': {
                marginInlineEnd: { xs: 0, sm: 2 },
                marginInlineStart: 0,
              },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {messages.navigation.profile}
            </Box>
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
