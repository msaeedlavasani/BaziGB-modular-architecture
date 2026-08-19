'use client';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** اسکلت ساختاری برای حالت بارگذاری (Loading) */
export default function LoadingSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: 3 }} />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width="30%" height={48} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width="30%" height={48} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  );
}
