'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  Stack,
  Button,
  Chip,
  IconButton,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LocalAtmRoundedIcon from '@mui/icons-material/LocalAtmRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import { colors } from '@/lib/theme/colors';
import { PACKAGES } from '@/lib/tokens/config';
import { useBalance } from '@/lib/hooks/useTokens';
import { postCheckoutSession } from '@/lib/api-client';
import ShareAppModal from '@/components/share/ShareAppModal';
import { getTokenTier, getTierColors } from '@/lib/tokens/tier';

export default function ParentTokensPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const balance = useBalance();
  const [loading, setLoading] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const handleBuy = async (packageId: string) => {
    setLoading(packageId);
    try {
      const { url } = await postCheckoutSession(packageId, locale);
      if (url) window.location.href = url;
      else throw new Error('No checkout URL returned');
    } catch (err) {
      console.error('[checkout]', err);
      const detail = err instanceof Error ? err.message : String(err);
      alert(`${t('tokens.errorCheckout')}\n\n${detail}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
          color: 'white',
          p: 3,
          pb: 4,
          borderRadius: '0 0 28px 28px',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ color: 'white' }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('tokens.title')}
          </Typography>
        </Stack>

        {(() => {
          const safeBalance = balance ?? 0;
          const tier = getTokenTier(safeBalance);
          const tierC = getTierColors(tier);
          return (
            <Card
              sx={{
                bgcolor: 'rgba(255,255,255,0.18)',
                color: 'white',
                p: 2.5,
                borderRadius: 3,
                border: `1.5px solid ${tierC.light}`,
                boxShadow: `0 6px 20px ${tierC.main}55`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>
                    {t('tokens.yourBalance')}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      {balance ?? '—'}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      {t('tokens.tokens')}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: tierC.light, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {tier}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${tierC.light}, ${tierC.main})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.2), 0 4px 12px ${tierC.main}88`,
                  }}
                >
                  <MonetizationOnRoundedIcon sx={{ fontSize: 40, color: 'white', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }} />
                </Box>
              </Stack>
            </Card>
          );
        })()}
      </Box>

      <Container maxWidth="sm" sx={{ mt: 3 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ShareRoundedIcon />}
          onClick={() => setShareOpen(true)}
          sx={{
            mb: 3,
            py: 1.5,
            borderRadius: 3,
            borderColor: colors.primary,
            color: colors.primary,
            fontWeight: 700,
          }}
        >
          {t('tokens.shareToEarn')}
        </Button>

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {t('tokens.buyPacks')}
        </Typography>

        <Stack spacing={1.5}>
          {PACKAGES.map((pack, i) => {
            const isBest = pack.id === 'mega';
            return (
              <motion.div
                key={pack.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: isBest ? `2px solid ${colors.accent}` : '2px solid transparent',
                    background: isBest
                      ? `linear-gradient(135deg, ${colors.accent}11, white)`
                      : 'white',
                    position: 'relative',
                  }}
                >
                  {isBest && (
                    <Chip
                      label={t('tokens.bestValue')}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: 16,
                        bgcolor: colors.accent,
                        color: colors.textPrimary,
                        fontWeight: 800,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {pack.label}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.3 }}>
                        <LocalAtmRoundedIcon sx={{ fontSize: '1rem', color: colors.primary }} />
                        <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 700 }}>
                          {pack.tokens} {t('tokens.tokens')}
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => handleBuy(pack.id)}
                      disabled={loading !== null}
                      sx={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                        borderRadius: 3,
                        minWidth: 100,
                        fontWeight: 700,
                      }}
                    >
                      {loading === pack.id ? '...' : `$${pack.priceUsd}`}
                    </Button>
                  </Stack>
                </Card>
              </motion.div>
            );
          })}
        </Stack>

        <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'text.secondary', textAlign: 'center' }}>
          {t('tokens.disclaimer')}
        </Typography>
      </Container>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </Box>
  );
}
