'use client';

import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { colors } from '@/lib/theme/colors';

export default function TokensCancelPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={3} alignItems="center" textAlign="center">
          <CancelRoundedIcon sx={{ fontSize: 96, color: colors.textMuted }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t('tokens.cancelTitle')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('tokens.cancelBody')}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => router.push(`/${locale}/parent/tokens`)}
            sx={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              borderRadius: 3,
              py: 1.5,
            }}
          >
            {t('tokens.backToTokens')}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
