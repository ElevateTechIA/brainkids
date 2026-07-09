'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Container, Button, Stack, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import dynamic from 'next/dynamic';
import type { ForceMode } from './BridgeCanvas';

const BridgeCanvas = dynamic(() => import('./BridgeCanvas'), { ssr: false });

// Correct force mode per member (left→right): outer members hang from the
// towers (TENSION), inner members prop onto the central pier (COMPRESSION).
const CORRECT: ForceMode[] = ['tension', 'compression', 'compression', 'tension'];
const TENSION_COLOR = '#2f80ed';
const COMPRESSION_COLOR = '#e74c3c';

export default function BridgeBuilderPage() {
  const t = useTranslations('games.bridgeBuilder');
  const { playWin, playWhoosh, playWrong } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [modes, setModes] = useState<ForceMode[]>(['unset', 'unset', 'unset', 'unset']);
  const [testToken, setTestToken] = useState(0);
  const [testing, setTesting] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'fail' | null>(null);
  const [weakIndex, setWeakIndex] = useState(-1);
  const [needAll, setNeedAll] = useState(false);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  const attemptsRef = useRef(0);
  const testCountRef = useRef(0);

  useEffect(() => {
    document.title = t('title');
  }, [t]);

  const setMember = (i: number, mode: ForceMode) => {
    if (testing) return;
    setOutcome(null);
    setNeedAll(false);
    setModes((prev) => {
      const next = [...prev];
      next[i] = mode;
      return next;
    });
  };

  const runTest = () => {
    if (testing) return;
    if (modes.some((m) => m === 'unset')) {
      setNeedAll(true);
      return;
    }
    const weak = modes.findIndex((m, i) => m !== CORRECT[i]);
    setWeakIndex(weak);
    setOutcome(null);
    attemptsRef.current += 1;
    testCountRef.current += 1;
    playWhoosh();
    setTesting(true);
    setTestToken(testCountRef.current);
  };

  const handleReset = () => {
    if (testing) return;
    setModes(['unset', 'unset', 'unset', 'unset']);
    setOutcome(null);
    setNeedAll(false);
    setWeakIndex(-1);
    setTestToken(0);
  };

  const handleTestEnd = (success: boolean) => {
    setTesting(false);
    setTestToken(0);
    if (success) {
      playWin();
      const points = attemptsRef.current === 1 ? 100 : 50;
      const stars = attemptsRef.current === 1 ? 3 : 2;
      attemptsRef.current = 0;
      setLastPoints(points);
      setOutcome('win');
      setScore((s) => {
        const next = s + points;
        updateGameProgress('bridge-builder', { highScore: next, stars, currentLevel: 1 });
        return next;
      });
      addXp(points);
      setShowCelebration(true);
    } else {
      playWrong();
      setOutcome('fail');
    }
  };

  const modeColor = (m: ForceMode) =>
    m === 'tension' ? TENSION_COLOR : m === 'compression' ? COMPRESSION_COLOR : '#9aa0a6';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} color={colors.physics} title={t('title')} />

      <Container maxWidth="sm" sx={{ pt: 2 }}>
        {/* Instruction */}
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 1.5 }}>
          {t('instruction')}
        </Typography>

        {/* Canvas */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            mb: 2,
            height: 300,
            position: 'relative',
          }}
        >
          <BridgeCanvas
            modes={modes.join(',')}
            testToken={testToken}
            success={weakIndex === -1}
            weakIndex={weakIndex}
            labels={{ tension: t('tension'), compression: t('compression') }}
            onTestEnd={handleTestEnd}
          />
        </Box>

        {/* Legend */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={`T — ${t('tension')}: ${t('tensionHint')}`}
            sx={{ bgcolor: `${TENSION_COLOR}22`, color: TENSION_COLOR, fontWeight: 700 }}
          />
          <Chip
            label={`C — ${t('compression')}: ${t('compressionHint')}`}
            sx={{ bgcolor: `${COMPRESSION_COLOR}22`, color: COMPRESSION_COLOR, fontWeight: 700 }}
          />
        </Stack>

        {/* Outcome / hints */}
        <AnimatePresence>
          {(outcome === 'fail' || needAll) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Box
                sx={{
                  bgcolor: `${colors.warning}33`,
                  border: `2px solid ${colors.warning}`,
                  borderRadius: 3,
                  px: 2,
                  py: 1.5,
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#8a6d00' }}>
                  {needAll ? t('assignAll') : t('fail', { n: weakIndex + 1 })}
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls: assign a mode to each member */}
        <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.physics, mb: 1.5 }}>
            🔧 {t('controls')}
          </Typography>

          <Stack spacing={1.5}>
            {modes.map((m, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    bgcolor: modeColor(m),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    flex: '0 0 auto',
                  }}
                >
                  {i + 1}
                </Box>
                <Button
                  onClick={() => setMember(i, 'tension')}
                  disabled={testing}
                  variant={m === 'tension' ? 'contained' : 'outlined'}
                  fullWidth
                  sx={{
                    bgcolor: m === 'tension' ? TENSION_COLOR : 'transparent',
                    borderColor: TENSION_COLOR,
                    color: m === 'tension' ? 'white' : TENSION_COLOR,
                    '&:hover': { bgcolor: m === 'tension' ? TENSION_COLOR : `${TENSION_COLOR}11`, borderColor: TENSION_COLOR },
                  }}
                >
                  T · {t('tension')}
                </Button>
                <Button
                  onClick={() => setMember(i, 'compression')}
                  disabled={testing}
                  variant={m === 'compression' ? 'contained' : 'outlined'}
                  fullWidth
                  sx={{
                    bgcolor: m === 'compression' ? COMPRESSION_COLOR : 'transparent',
                    borderColor: COMPRESSION_COLOR,
                    color: m === 'compression' ? 'white' : COMPRESSION_COLOR,
                    '&:hover': { bgcolor: m === 'compression' ? COMPRESSION_COLOR : `${COMPRESSION_COLOR}11`, borderColor: COMPRESSION_COLOR },
                  }}
                >
                  C · {t('compression')}
                </Button>
              </Stack>
            ))}
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={runTest}
              disabled={testing}
              fullWidth
              sx={{ bgcolor: colors.physics, '&:hover': { bgcolor: colors.physicsLight } }}
            >
              🚚 {testing ? t('testing') : t('test')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={testing}
              fullWidth
              sx={{ borderColor: colors.physics, color: colors.physics }}
            >
              🔄 {t('reset')}
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
            💡 {t('lessonPath')}
          </Typography>
        </Box>
      </Container>

      <RewardCelebration
        show={showCelebration}
        message={t('winTitle')}
        xpGained={lastPoints}
        stars={lastPoints === 100 ? 3 : 2}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
