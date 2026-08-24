'use client';
import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/sound-service';
import { honeyBronze } from '@/theme';
import type { Locale } from '@/i18n/config';
import { getMessages } from '@/i18n/messages';
import { APP_ROUTES, stripLocale } from '@/i18n/routing';

interface HeaderProps {
  locale?: Locale;
}

export default function Header({ locale = 'fa' }: HeaderProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);
  const messages = getMessages(locale);
  const routePathname = stripLocale(pathname).pathname;

  const navLinks = useMemo(
    () => [
      { href: APP_ROUTES.lobby, label: messages.navigation.lobby, icon: Gamepad2 },
      { href: APP_ROUTES.leaderboard, label: messages.navigation.leaderboard, icon: Trophy },
      { href: APP_ROUTES.tournaments, label: messages.navigation.tournaments, icon: Swords },
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
        bgcolor: 'rgba(6, 26, 45, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid',
        borderColor: 'rgba(57, 46, 36, 0.6)',
      }}
    >
      <Toolbar sx={{ gap: 4, minHeight: 64, px: { xs: 4, sm: 6 } }}>
        <Link href={APP_ROUTES.lobby} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: theme.spacing(3) }}>
          <Box sx={{ position: 'relative', width: 36, height: 36, overflow: 'hidden', borderRadius: 2.5 }}>
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

        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'center', minWidth: 0 }}>
          {navLinks.map((link) => {
            const active = routePathname === link.href || routePathname.startsWith(`${link.href}/`);
            return (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                startIcon={<link.icon size={20} />}
                variant={active ? 'contained' : 'text'}
                color={active ? 'primary' : 'inherit'}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  color: active ? 'secondary.main' : 'text.secondary',
                  '& .MuiButton-startIcon': {
                    marginInlineEnd: 2,
                    marginInlineStart: -0.5,
                  },
                  '&:hover': {
                    color: active ? 'secondary.main' : 'primary.main',
                    bgcolor: active ? 'primary.light' : 'rgba(238,172,47,0.08)',
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            href={APP_ROUTES.profile}
            startIcon={<User size={20} />}
            sx={{
              color: routePathname === APP_ROUTES.profile ? 'primary.main' : 'text.secondary',
              px: 3,
              borderRadius: 3,
              fontWeight: 800,
              '& .MuiButton-startIcon': {
                marginInlineEnd: 2,
                marginInlineStart: -0.5,
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
