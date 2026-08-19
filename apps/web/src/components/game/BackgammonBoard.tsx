'use client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * نمایش یک نقطه نرد با مهره‌های پشته‌شده
 * p1 (برنز) از پایین، p2 (سرمه‌ای) از بالا
 */
function TrianglePoint({ count, top }: { count: number; top: boolean }) {
  const discs = Math.min(Math.abs(count), 5);
  const color = count > 0 ? '#EEAC2F' : '#1B3550';
  const items = [];
  for (let i = 0; i < discs; i++) {
    items.push(
      <Box
        key={i}
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${count > 0 ? '#FFD27A' : '#2E5A8A'} 0%, ${color} 60%, ${count > 0 ? '#8A6410' : '#081120'} 100%)`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.25)',
        }}
      />,
    );
  }
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: top ? 'flex-start' : 'flex-end',
        height: 110,
        pt: top ? 0.5 : 0,
        pb: top ? 0 : 0.5,
        position: 'relative',
        cursor: 'pointer',
        '&:hover': { bgcolor: 'rgba(238,172,47,0.08)' },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 62,
          background: 'linear-gradient(180deg, #4A3420 0%, #2E2114 100%)',
          clipPath: top ? 'polygon(50% 100%, 0 0, 100% 0)' : 'polygon(50% 0%, 0 100%, 100% 100%)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          opacity: 0.85,
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px', position: 'absolute', bottom: top ? 'auto' : 6, top: top ? 6 : 'auto' }}>
        {items}
      </Box>
      {Math.abs(count) > 5 && (
        <Typography variant="caption" sx={{ position: 'absolute', color: 'text.secondary' }}>
          {Math.abs(count)}
        </Typography>
      )}
    </Box>
  );
}

interface Props {
  board: number[];
  bar: Record<number, number>;
  off: Record<number, number>;
  onSelectPoint?: (point: number) => void;
}

/** برد نرد — چوب طبیعی با مثلث‌های متناوب و سایه داخلی */
export default function BackgammonBoard({ board, bar, off, onSelectPoint }: Props) {
  const top = board.slice(12, 24).reverse(); // نقطه ۲۳ در راست
  const bottom = board.slice(0, 12).reverse();

  const renderRow = (points: number[], reversed: boolean) =>
    points.map((count, i) => {
      const realIndex = reversed ? 11 - i : 12 + (11 - i);
      return (
        <Box key={realIndex} onClick={() => onSelectPoint?.(realIndex)} sx={{ flex: 1, minWidth: 0 }}>
          <TrianglePoint count={count} top={!reversed} />
        </Box>
      );
    });

  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          border: '2px solid #5A4126',
          background: 'linear-gradient(160deg, #4A3420 0%, #2A1D10 100%)',
          boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.65), 0 10px 30px rgba(0,0,0,0.45)',
        }}
      >
        {/* ستون off (چپ) */}
        <Box
          sx={{
            width: 46,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: 'rgba(0,0,0,0.25)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            خارج
          </Typography>
          <Typography variant="body2" sx={{ color: '#EEAC2F' }}>{off[1] ?? 0}</Typography>
          <Typography variant="body2" sx={{ color: '#7FA8D9' }}>{off[-1] ?? 0}</Typography>
        </Box>

        {/* مثلث‌ها */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', width: '100%' }}>{renderRow(top, false)}</Box>
          <Box sx={{ display: 'flex', width: '100%', borderTop: '2px solid #3A2A18' }}>{renderRow(bottom, true)}</Box>
        </Box>

        {/* ستون bar (راست) */}
        <Box
          sx={{
            width: 46,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: 'rgba(0,0,0,0.35)',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            زندان
          </Typography>
          <Typography variant="body2" sx={{ color: '#EEAC2F' }}>{bar[1] ?? 0}</Typography>
          <Typography variant="body2" sx={{ color: '#7FA8D9' }}>{bar[-1] ?? 0}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
