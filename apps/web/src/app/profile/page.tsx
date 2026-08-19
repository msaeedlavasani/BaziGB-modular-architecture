'use client';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/Person';
import EmptyState from '@/components/shared/EmptyState';

export default function Profile() {
  const router = useRouter();
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Typography variant="h4" sx={{ color: 'text.primary', mb: 2 }}>
        پروفایل
      </Typography>
      <EmptyState
        icon={<PersonIcon fontSize="inherit" />}
        title="هنوز آماری ثبت نشده است"
        description="بازی کنید تا آمار برد، باخت و امتیاز مسابقات اینجا نمایش داده شود."
        actionLabel="بازگشت به لابی"
        onAction={() => router.push('/lobby')}
      />
    </Box>
  );
}
