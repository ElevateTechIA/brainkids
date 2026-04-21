'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, Stack, IconButton, LinearProgress } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

type Stage = 'intro' | 'practice' | 'done';
type Phase = 'inhale' | 'hold' | 'exhale';

const TOTAL_BREATHS = 6;
const INHALE_MS = 4000;
const HOLD_MS = 1500;
const EXHALE_MS = 6000;
const XP_REWARD = 30;

export default function SadhanaPage() {
  const t = useTranslations('sadhanaContent');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const addXp = usePlayerStore((s) => s.addXp);

  const [stage, setStage] = useState<Stage>('intro');
  const [breath, setBreath] = useState(1);
  const [phase, setPhase] = useState<Phase>('inhale');
  const xpAwarded = useRef(false);

  useEffect(() => {
    if (stage !== 'practice') return;

    const cycleMs = INHALE_MS + HOLD_MS + EXHALE_MS;
    const inhaleEnd = INHALE_MS;
    const holdEnd = inhaleEnd + HOLD_MS;

    setPhase('inhale');
    const tInhaleToHold = setTimeout(() => setPhase('hold'), inhaleEnd);
    const tHoldToExhale = setTimeout(() => setPhase('exhale'), holdEnd);
    const tNext = setTimeout(() => {
      if (breath >= TOTAL_BREATHS) {
        setStage('done');
      } else {
        setBreath((b) => b + 1);
      }
    }, cycleMs);

    return () => {
      clearTimeout(tInhaleToHold);
      clearTimeout(tHoldToExhale);
      clearTimeout(tNext);
    };
  }, [stage, breath]);

  useEffect(() => {
    if (stage === 'done' && !xpAwarded.current) {
      xpAwarded.current = true;
      addXp(XP_REWARD);
    }
  }, [stage, addXp]);

  const phaseLabel = phase === 'inhale' ? t('inhale') : phase === 'hold' ? t('hold') : t('exhale');
  const circleScale = phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.3 : 0.6;
  const circleDuration = phase === 'inhale' ? INHALE_MS / 1000 : phase === 'exhale' ? EXHALE_MS / 1000 : HOLD_MS / 1000;

  return (
    <Box sx={{ bgcolor: colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <IconButton onClick={() => router.push(`/${locale}/home`)}>
          <ArrowBackRoundedIcon />
        </IconButton>
      </Box>

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 3 }}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Stack spacing={3} alignItems="center" textAlign="center">
                <SelfImprovementRoundedIcon sx={{ fontSize: 96, color: colors.sadhana }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: colors.sadhana }}>
                  {t('introTitle')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {t('introBody')}
                </Typography>
                <Stack spacing={1} sx={{ width: '100%', textAlign: 'left' }}>
                  <Typography variant="body2">
                    1. {t('step1')}
                  </Typography>
                  <Typography variant="body2">
                    2. {t('step2')}
                  </Typography>
                  <Typography variant="body2">
                    3. {t('step3')}
                  </Typography>
                </Stack>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setStage('practice')}
                  sx={{
                    background: `linear-gradient(135deg, ${colors.sadhana}, ${colors.sadhanaLight})`,
                    borderRadius: 3,
                    py: 1.5,
                    fontWeight: 800,
                  }}
                >
                  {t('start')}
                </Button>
              </Stack>
            </motion.div>
          )}

          {stage === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Stack spacing={3} alignItems="center" textAlign="center">
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                  {t('breathOf', { current: breath, total: TOTAL_BREATHS })}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(breath / TOTAL_BREATHS) * 100}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    bgcolor: `${colors.sadhana}22`,
                    '& .MuiLinearProgress-bar': { bgcolor: colors.sadhana, borderRadius: 3 },
                  }}
                />
                <Box sx={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div
                    animate={{ scale: circleScale }}
                    transition={{ duration: circleDuration, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${colors.sadhanaLight}, ${colors.sadhana})`,
                      boxShadow: `0 0 60px ${colors.sadhana}66`,
                    }}
                  />
                  <Typography variant="h5" sx={{ position: 'relative', color: 'white', fontWeight: 800, zIndex: 1, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    {phaseLabel}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {phase === 'inhale' ? t('hintInhale') : phase === 'exhale' ? t('hintExhale') : t('hintHold')}
                </Typography>
              </Stack>
            </motion.div>
          )}

          {stage === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180 }}
            >
              <Stack spacing={3} alignItems="center" textAlign="center">
                <Box sx={{ position: 'relative' }}>
                  <SelfImprovementRoundedIcon sx={{ fontSize: 96, color: colors.sadhana }} />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                    style={{
                      position: 'absolute',
                      inset: -10,
                      border: `3px dashed ${colors.sadhanaLight}`,
                      borderRadius: '50%',
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: colors.sadhana }}>
                  {t('doneTitle')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {t('doneBody')}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: `${colors.accent}22`, px: 2, py: 1, borderRadius: 2 }}>
                  <StarRoundedIcon sx={{ color: colors.accent }} />
                  <Typography sx={{ fontWeight: 800, color: colors.textPrimary }}>
                    +{XP_REWARD} XP
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push(`/${locale}/home`)}
                    sx={{ borderRadius: 3, borderColor: colors.sadhana, color: colors.sadhana }}
                  >
                    {t('home')}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      xpAwarded.current = false;
                      setBreath(1);
                      setStage('practice');
                    }}
                    sx={{
                      background: `linear-gradient(135deg, ${colors.sadhana}, ${colors.sadhanaLight})`,
                      borderRadius: 3,
                    }}
                  >
                    {t('again')}
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Box>
  );
}
