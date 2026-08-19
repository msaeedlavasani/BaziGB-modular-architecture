'use client';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CasinoIcon from '@mui/icons-material/Casino';
import { useState } from 'react';

/**
 * هدر BaziGB — RTL: برند در راست (اولین فرزند) و آیکون‌ها در چپ
 */
export default function Header() {
  const pathname = usePathname();
  const [sound, setSound] = useState(true);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'secondary.main',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 0,
      }}
    >
      <Toolbar sx={{ gap: 1, minWidth: 0 }}>
        {/* برند — راست در RTL */}
        <Link href="/lobby" style={{ textDecoration: 'none', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <CasinoIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              sx={{
                color: 'primary.main',
                fontWeight: 800,
                letterSpacing: 1,
                whiteSpace: 'nowrap',
              }}
            >
              BaziGB
            </Typography>
          </Box>
        </Link>

        {/* ناوبری */}
        <Box sx={{ display: 'flex', gap: 0.5, minWidth: 0, overflowX: 'auto' }}>
          {[
            { href: '/lobby', label: 'لابی' },
            { href: '/leaderboard', label: 'رتبه‌بندی' },
            { href: '/tournaments', label: 'تورنمنت' },
          ].map((item) => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  color: pathname === item.href ? 'primary.main' : 'text.secondary',
                  bgcolor: pathname === item.href ? 'rgba(238,172,47,0.1)' : 'transparent',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {item.label}
              </Typography>
            </Link>
          ))}
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* آیکون‌ها — چپ در RTL */}
        <IconButton
          onClick={() => setSound((s) => !s)}
          aria-label="صدا"
          sx={{ color: pathname === '/lobby' ? 'primary.main' : 'text.secondary' }}
        >
          {sound ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
        <IconButton
          component={Link}
          href="/profile"
          aria-label="پروفایل"
          sx={{ color: pathname === '/profile' ? 'primary.main' : 'text.secondary' }}
        >
          <PersonIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
