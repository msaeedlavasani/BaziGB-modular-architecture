'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

/**
 * فوتر BaziGB — RTL: [نماد (چپ)] --- [لینک‌ها (وسط)] --- [BaziGB (راست)]
 * ترتیب DOM در RTL: BaziGB، لینک‌ها، نماد
 */
const links = [
  { href: '/about', label: 'درباره ما' },
  { href: '/rules', label: 'قوانین' },
  { href: '/contact', label: 'تماس' },
];

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'secondary.main',
        py: 2,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* BaziGB — راست */}
      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
        BaziGB © {new Date().getFullYear()}
      </Typography>

      {/* لینک‌ها — وسط */}
      <Box sx={{ display: 'flex', gap: 2, minWidth: 0 }}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              {l.label}
            </Typography>
          </Link>
        ))}
      </Box>

      {/* نماد اعتماد — چپ */}
      <Box
        aria-label="نماد اعتماد الکترونیکی"
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px dashed',
          borderColor: 'primary.main',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        نماد
      </Box>
    </Box>
  );
}
