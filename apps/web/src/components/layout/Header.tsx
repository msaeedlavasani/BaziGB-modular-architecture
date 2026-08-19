'use client';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gamepad2, Swords, Trophy, User, Volume2, VolumeX } from 'lucide-react';
import { soundService } from '@/lib/sound-service';

/**
 * هدر BaziGB — بازسازی هدر قدیمی (لوگو + لینک‌های بازی + صدا + پروفایل)
 * RTL: برند در راست، لینک‌ها وسط، اکشن‌ها چپ
 */
const NAV_LINKS = [
  { href: '/lobby', label: 'لابی', icon: Gamepad2 },
  { href: '/leaderboard', label: 'رتبه‌بندی', icon: Trophy },
  { href: '/tournaments', label: 'تورنمنت', icon: Swords },
];

export default function Header() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);

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
      <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, minHeight: { xs: 56, sm: 64 } }}>
        {/* برند — راست در RTL */}
        <Link href="/lobby" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ position: 'relative', width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, overflow: 'hidden', borderRadius: 1.5 }}>
            <Image src="/brand/logo-icon.png" alt="BaziGB Logo" fill sizes="32px" style={{ objectFit: 'contain' }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: 'primary.main',
              fontWeight: 900,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.95rem', sm: '1.2rem' },
            }}
          >
            BaziGB
          </Typography>
        </Link>

        {/* لینک‌های ناوبری */}
        <Box sx={{ display: 'flex', gap: { xs: 0, sm: 0.5 }, flexGrow: 1, justifyContent: 'center', minWidth: 0, overflowX: 'auto' }}>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                startIcon={<link.icon size={16} />}
                sx={{
                  px: { xs: 0.75, sm: 1.5 },
                  py: 0.75,
                  minWidth: { xs: 40, sm: 'auto' },
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  fontWeight: 700,
                  color: active ? 'primary.main' : 'text.secondary',
                  bgcolor: active ? 'rgba(238,172,47,0.1)' : 'transparent',
                  border: '1px solid',
                  borderColor: active ? 'rgba(238,172,47,0.25)' : 'transparent',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: active ? 'rgba(238,172,47,0.16)' : 'rgba(255,255,255,0.05)',
                    color: active ? 'primary.main' : 'text.primary',
                  },
                  '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {link.label}
                </Box>
              </Button>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* اکشن‌ها — چپ در RTL */}
        <IconButton
          onClick={() => soundService.toggleMute()}
          aria-label={muted ? 'فعال‌سازی صدا' : 'قطع صدا'}
          sx={{ color: muted ? 'text.disabled' : 'primary.main' }}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </IconButton>
        <Button
          component={Link}
          href="/profile"
          startIcon={<User size={16} />}
          sx={{
            color: pathname === '/profile' ? 'primary.main' : 'text.secondary',
            textTransform: 'none',
            fontWeight: 600,
            px: { xs: 0.75, sm: 1.5 },
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'text.primary' },
            '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            پروفایل
          </Box>
        </Button>
      </Toolbar>
    </AppBar>
  );
}
