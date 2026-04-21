'use client';

import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { colors } from '@/lib/theme/colors';
import { useBalance } from '@/lib/hooks/useTokens';

export default function TokensSuccessPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const balance = useBalance();

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
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircleRoundedIcon sx={{ fontSize: 96, color: colors.success }} />
          </motion.div>
          <Typography variant="h5" sx={{ fontWeight: 800, color: colors.primary }}>
            {t('tokens.successTitle')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('tokens.successBody')}
          </Typography>
          {balance !== null && (
            <Typography variant="h4" sx={{ fontWeight: 800, color: colors.primary }}>
              {balance} {t('tokens.tokens')}
            </Typography>
          )}
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
          <Button onClick={() => router.push(`/${locale}/home`)}>
            {t('tokens.backToHome')}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
