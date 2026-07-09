'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
  ButtonBase,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { PACKAGES } from '@/lib/tokens/config';
import { useBalance } from '@/lib/hooks/useTokens';
import { postCheckoutSession } from '@/lib/api-client';
import ShareAppModal from '@/components/share/ShareAppModal';
import { getTokenTier, getTierColors } from '@/lib/tokens/tier';
import { useTheme } from '@/lib/theme/ThemeProvider';

const TIER_THRESHOLDS = {
  copper: 0,
  silver: 10,
  gold: 100,
  platinum: 500,
};

export default function ParentTokensPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const balance = useBalance();
  const { palette, themeName } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const isPlatinum = themeName === 'platinum';

  const safeBalance = balance ?? 0;
  const tier = getTokenTier(safeBalance);
  const tierC = getTierColors(tier);

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

  const nextTier =
    safeBalance < TIER_THRESHOLDS.silver
      ? { name: 'silver', target: TIER_THRESHOLDS.silver }
      : safeBalance < TIER_THRESHOLDS.gold
        ? { name: 'gold', target: TIER_THRESHOLDS.gold }
        : safeBalance < TIER_THRESHOLDS.platinum
          ? { name: 'platinum', target: TIER_THRESHOLDS.platinum }
          : null;

  const tierProgress = nextTier
    ? Math.min(100, (safeBalance / nextTier.target) * 100)
    : 100;

  return (
    <Box sx={{ bgcolor: palette.background, minHeight: '100vh', pb: 8 }}>
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton onClick={() => router.back()} sx={{ color: palette.textPrimary }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: palette.textPrimary, ml: 0.5 }}
        >
          {t('tokens.title')}
        </Typography>
      </Box>

      <Container maxWidth="sm" sx={{ pt: 1 }}>
        {/* Hero balance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ px: 1, pt: 2, pb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: palette.textSecondary,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
              }}
            >
              {t('tokens.yourBalance')}
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 0.5 }}>
              <Typography
                className={isPlatinum ? 'platinum-display' : ''}
                sx={{
                  fontSize: { xs: '4rem', sm: '5rem' },
                  fontWeight: 800,
                  lineHeight: 1,
                  color: palette.textPrimary,
                  fontFamily: isPlatinum
                    ? 'var(--font-fraunces), serif'
                    : 'var(--font-fredoka), sans-serif',
                  letterSpacing: isPlatinum ? '-0.04em' : 'normal',
                }}
              >
                {balance ?? '—'}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: palette.textSecondary,
                  fontWeight: 600,
                }}
              >
                {t('tokens.tokens')}
              </Typography>
            </Stack>

            {/* Tier badge with metallic chip */}
            <Box
              sx={{
                mt: 1.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                background: `linear-gradient(135deg, ${tierC.main}, ${tierC.light})`,
                boxShadow: `0 4px 14px ${tierC.main}55`,
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: '1rem', color: 'white' }} />
              <Typography
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: '0.72rem',
                }}
              >
                {tier} tier
              </Typography>
            </Box>

            {/* Progress to next tier */}
            {nextTier && (
              <Box sx={{ mt: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: palette.textSecondary,
                      fontWeight: 600,
                    }}
                  >
                    {nextTier.target - safeBalance} {t('tokens.tokens')} →{' '}
                    <span style={{ color: palette.textPrimary, textTransform: 'uppercase' }}>
                      {nextTier.name}
                    </span>
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      color: palette.textPrimary,
                      fontWeight: 700,
                    }}
                  >
                    {Math.round(tierProgress)}%
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: palette.cardBgHover,
                    overflow: 'hidden',
                    border: `1px solid ${palette.cardBorder}`,
                  }}
                >
                  <Box
                    className={isPlatinum ? 'accent-glow' : ''}
                    sx={{
                      width: `${tierProgress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${palette.accent}, ${palette.accentLight})`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </motion.div>

        {/* Tier benefits card (Robinhood-style) */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: palette.cardBg,
              border: `1px solid ${palette.cardBorder}`,
              mb: 3,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.7rem',
                color: palette.textSecondary,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                mb: 1.5,
              }}
            >
              Your benefits
            </Typography>

            <Stack spacing={1.5}>
              {(['copper', 'silver', 'gold', 'platinum'] as const).map((t) => {
                const tCol = getTierColors(t);
                const reached = TIER_THRESHOLDS[t] <= safeBalance;
                const isCurrent = t === tier;
                return (
                  <Stack
                    key={t}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      opacity: reached ? 1 : 0.5,
                      pb: t === 'platinum' ? 0 : 1.5,
                      borderBottom:
                        t === 'platinum' ? 'none' : `1px solid ${palette.cardBorder}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: reached
                          ? `linear-gradient(135deg, ${tCol.main}, ${tCol.light})`
                          : 'transparent',
                        border: reached ? 'none' : `1.5px solid ${palette.cardBorder}`,
                      }}
                    >
                      {reached ? (
                        <CheckCircleRoundedIcon sx={{ fontSize: '1.2rem', color: 'white' }} />
                      ) : (
                        <LockRoundedIcon sx={{ fontSize: '1rem', color: palette.textMuted }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: isCurrent ? tCol.main : palette.textPrimary,
                          textTransform: 'capitalize',
                        }}
                      >
                        {t}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.78rem', color: palette.textSecondary }}
                      >
                        {TIER_THRESHOLDS[t] === 0
                          ? 'Starting tier'
                          : `${TIER_THRESHOLDS[t]}+ tokens`}
                      </Typography>
                    </Box>
                    {isCurrent && (
                      <Typography
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: tCol.main,
                          letterSpacing: '0.1em',
                        }}
                      >
                        CURRENT
                      </Typography>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        </motion.div>

        {/* Share to earn — pill CTA */}
        <Button
          fullWidth
          startIcon={<ShareRoundedIcon />}
          onClick={() => setShareOpen(true)}
          sx={{
            mb: 4,
            py: 1.5,
            borderRadius: 999,
            bgcolor: palette.cardBg,
            color: palette.textPrimary,
            border: `1px solid ${palette.cardBorder}`,
            fontWeight: 700,
            fontSize: '0.95rem',
            '&:hover': {
              bgcolor: palette.cardBgHover,
              borderColor: palette.primary,
            },
          }}
        >
          {t('tokens.shareToEarn')}
        </Button>

        {/* Buy tokens section */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5, px: 0.5 }}>
          <TrendingUpRoundedIcon sx={{ color: palette.primary }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: palette.textPrimary,
              fontFamily: isPlatinum
                ? 'var(--font-fraunces), serif'
                : 'var(--font-fredoka), sans-serif',
              letterSpacing: isPlatinum ? '-0.02em' : 'normal',
            }}
          >
            {t('tokens.buyPacks')}
          </Typography>
        </Stack>

        <Stack spacing={1.25}>
          {PACKAGES.map((pack, i) => {
            const isBest = pack.id === 'mega';
            const isLoading = loading === pack.id;
            return (
              <motion.div
                key={pack.id}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                <ButtonBase
                  onClick={() => handleBuy(pack.id)}
                  disabled={loading !== null}
                  sx={{
                    width: '100%',
                    p: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'block',
                    textAlign: 'left',
                    transition: 'transform 0.15s ease',
                    '&:hover': { transform: 'translateY(-1px)' },
                    '&:active': { transform: 'translateY(0)' },
                  }}
                >
                  <Box
                    sx={{
                      p: 2.25,
                      borderRadius: 2,
                      bgcolor: palette.cardBg,
                      border: `1px solid ${
                        isBest ? palette.premium : palette.cardBorder
                      }`,
                      position: 'relative',
                      ...(isBest && {
                        background: `linear-gradient(135deg, ${palette.cardBg} 0%, ${palette.cardBgHover} 100%)`,
                        boxShadow: `0 0 0 1px ${palette.premium}33, 0 8px 24px ${palette.premium}22`,
                      }),
                    }}
                  >
                    {isBest && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: 16,
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          background: `linear-gradient(135deg, ${palette.premium}, ${palette.premiumLight})`,
                          color: '#1a1a1a',
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {t('tokens.bestValue')}
                      </Box>
                    )}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: palette.textPrimary,
                            mb: 0.25,
                          }}
                        >
                          {pack.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.85rem',
                            color: isBest ? palette.premium : palette.primary,
                            fontWeight: 700,
                          }}
                        >
                          {pack.tokens} {t('tokens.tokens')}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          minWidth: 92,
                          py: 1.1,
                          px: 2.25,
                          borderRadius: 999,
                          textAlign: 'center',
                          bgcolor: isBest ? palette.premium : palette.primary,
                          color: isBest
                            ? '#1a1a1a'
                            : isPlatinum
                              ? '#0a0a0a'
                              : '#fff',
                          fontWeight: 800,
                          fontSize: '1rem',
                          opacity: isLoading ? 0.6 : 1,
                        }}
                      >
                        {isLoading ? '...' : `$${pack.priceUsd}`}
                      </Box>
                    </Stack>
                  </Box>
                </ButtonBase>
              </motion.div>
            );
          })}
        </Stack>

        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 3,
            color: palette.textMuted,
            textAlign: 'center',
            fontSize: '0.75rem',
          }}
        >
          {t('tokens.disclaimer')}
        </Typography>
      </Container>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </Box>
  );
}
