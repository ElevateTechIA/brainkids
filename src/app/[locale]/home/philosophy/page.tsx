'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Button, Stack, IconButton, LinearProgress, Card } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

const STEPS = ['name', 'body', 'feelings', 'thoughts'] as const;
type Step = (typeof STEPS)[number];
type Stage = 'intro' | Step | 'reflection';

const XP_REWARD = 30;

export default function PhilosophyPage() {
  const t = useTranslations('philosophyContent');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const addXp = usePlayerStore((s) => s.addXp);

  const [stage, setStage] = useState<Stage>('intro');
  const [answered, setAnswered] = useState<Record<Step, string | null>>({
    name: null,
    body: null,
    feelings: null,
    thoughts: null,
  });
  const xpAwarded = useRef(false);

  useEffect(() => {
    if (stage === 'reflection' && !xpAwarded.current) {
      xpAwarded.current = true;
      addXp(XP_REWARD);
    }
  }, [stage, addXp]);

  const stepIndex = STEPS.findIndex((s) => s === stage);
  const isStep = stepIndex >= 0;

  const goNext = () => {
    if (!isStep) return;
    const next = STEPS[stepIndex + 1];
    setStage(next ?? 'reflection');
  };

  const handleAnswer = (step: Step, value: string) => {
    setAnswered((prev) => ({ ...prev, [step]: value }));
    setTimeout(goNext, 700);
  };

  return (
    <Box sx={{ bgcolor: colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <IconButton onClick={() => router.push(`/${locale}/home`)}>
          <ArrowBackRoundedIcon />
        </IconButton>
      </Box>

      {isStep && (
        <Box sx={{ px: 3, mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={((stepIndex + 1) / STEPS.length) * 100}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: `${colors.philosophy}22`,
              '& .MuiLinearProgress-bar': { bgcolor: colors.philosophy, borderRadius: 3 },
            }}
          />
        </Box>
      )}

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 3 }}>
        <AnimatePresence mode="wait">
          {stage === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Stack spacing={3} alignItems="center" textAlign="center">
                <PsychologyRoundedIcon sx={{ fontSize: 96, color: colors.philosophy }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: colors.philosophy }}>
                  {t('introTitle')}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  {t('introBody')}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => setStage('name')}
                  sx={{
                    background: `linear-gradient(135deg, ${colors.philosophy}, ${colors.philosophyLight})`,
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

          {isStep && (
            <motion.div key={stage} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Stack spacing={3}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textAlign: 'center' }}>
                  {t('questionOf', { current: stepIndex + 1, total: STEPS.length })}
                </Typography>
                <Card sx={{ p: 3, borderRadius: 3, bgcolor: `${colors.philosophy}08`, border: `2px solid ${colors.philosophy}22`, boxShadow: 'none' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.philosophy, mb: 1 }}>
                    {t(`q.${stage}.title`)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t(`q.${stage}.body`)}
                  </Typography>
                </Card>

                <Stack spacing={1.5}>
                  {(['yes', 'no', 'maybe'] as const).map((opt) => {
                    const selected = answered[stage as Step] === opt;
                    return (
                      <Button
                        key={opt}
                        variant={selected ? 'contained' : 'outlined'}
                        size="large"
                        onClick={() => handleAnswer(stage as Step, opt)}
                        sx={{
                          borderRadius: 3,
                          py: 1.5,
                          justifyContent: 'flex-start',
                          fontWeight: 700,
                          ...(selected
                            ? {
                                background: `linear-gradient(135deg, ${colors.philosophy}, ${colors.philosophyLight})`,
                              }
                            : {
                                borderColor: colors.philosophy,
                                color: colors.philosophy,
                              }),
                        }}
                      >
                        {t(`option.${opt}`)}
                      </Button>
                    );
                  })}
                </Stack>
              </Stack>
            </motion.div>
          )}

          {stage === 'reflection' && (
            <motion.div key="reflection" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
              <Stack spacing={3} alignItems="center" textAlign="center">
                <PsychologyRoundedIcon sx={{ fontSize: 96, color: colors.philosophy }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: colors.philosophy }}>
                  {t('reflectionTitle')}
                </Typography>
                <Card sx={{ p: 3, borderRadius: 3, bgcolor: `${colors.philosophy}08`, border: `2px solid ${colors.philosophy}33`, boxShadow: 'none' }}>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontStyle: 'italic' }}>
                    &ldquo;{t('reflectionQuote')}&rdquo;
                  </Typography>
                </Card>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('reflectionBody')}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: `${colors.accent}22`, px: 2, py: 1, borderRadius: 2 }}>
                  <StarRoundedIcon sx={{ color: colors.accent }} />
                  <Typography sx={{ fontWeight: 800, color: colors.textPrimary }}>+{XP_REWARD} XP</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push(`/${locale}/home`)}
                    sx={{ borderRadius: 3, borderColor: colors.philosophy, color: colors.philosophy }}
                  >
                    {t('home')}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      xpAwarded.current = false;
                      setAnswered({ name: null, body: null, feelings: null, thoughts: null });
                      setStage('intro');
                    }}
                    sx={{ background: `linear-gradient(135deg, ${colors.philosophy}, ${colors.philosophyLight})`, borderRadius: 3 }}
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
