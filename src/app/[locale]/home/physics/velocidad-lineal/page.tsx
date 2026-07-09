'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Container, Slider, Button, Chip, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import dynamic from 'next/dynamic';

const VelocityCanvas = dynamic(() => import('./VelocityCanvas'), { ssr: false });

const DISTANCE_M = 20; // fixed track length
const TARGETS = [4, 5, 2, 2.5]; // target times (s) → v = 20/T = 5, 4, 10, 8 m/s
const TOLERANCE = 0.15; // s

export default function VelocidadLinealPage() {
  const t = useTranslations('games.velocidadLineal');
  const { playWin, playWhoosh, playWrong } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [velocity, setVelocity] = useState(5);
  const [level, setLevel] = useState(0);
  const [runToken, setRunToken] = useState(0);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<'win' | 'fast' | 'slow' | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  const attemptsRef = useRef(0);
  const runCountRef = useRef(0);

  const targetTime = TARGETS[level % TARGETS.length];
  const predictedTime = Math.round((DISTANCE_M / velocity) * 100) / 100;

  useEffect(() => {
    document.title = t('title');
  }, [t]);

  const handleGo = () => {
    if (running) return;
    playWhoosh();
    attemptsRef.current += 1;
    runCountRef.current += 1;
    setOutcome(null);
    setElapsed(0);
    setRunning(true);
    setRunToken(runCountRef.current);
  };

  const handleReset = () => {
    if (running) return;
    setOutcome(null);
    setElapsed(0);
    setRunToken(0);
  };

  const handleArrive = (time: number) => {
    setRunning(false);
    setRunToken(0);
    const diff = time - targetTime;
    if (Math.abs(diff) <= TOLERANCE) {
      playWin();
      const points = attemptsRef.current === 1 ? 100 : 50;
      const stars = attemptsRef.current === 1 ? 3 : 2;
      attemptsRef.current = 0;
      setLastPoints(points);
      setOutcome('win');
      setScore((s) => {
        const next = s + points;
        updateGameProgress('velocidad-lineal', { highScore: next, stars, currentLevel: level + 1 });
        return next;
      });
      addXp(points);
      setShowCelebration(true);
      setTimeout(() => setLevel((l) => l + 1), 1500);
    } else {
      playWrong();
      setOutcome(diff < 0 ? 'fast' : 'slow');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} color={colors.physics} title={t('title')} />

      <Container maxWidth="sm" sx={{ pt: 2 }}>
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
          <VelocityCanvas
            velocity={velocity}
            distanceM={DISTANCE_M}
            runToken={runToken}
            onProgress={(time) => setElapsed(time)}
            onArrive={handleArrive}
          />
        </Box>

        {/* Readouts */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip label={`${t('distance')}: ${DISTANCE_M} m`} sx={{ bgcolor: `${colors.physics}22`, color: colors.physics, fontWeight: 700 }} />
          <Chip label={`${t('targetTime')}: ${targetTime} s`} sx={{ bgcolor: '#e74c3c22', color: '#e74c3c', fontWeight: 700 }} />
          <Chip label={`${t('estTime')}: ${predictedTime} s`} sx={{ bgcolor: '#2ecc7122', color: '#1e8e4e', fontWeight: 700 }} />
          {running && <Chip label={`⏱ ${elapsed} s`} sx={{ bgcolor: '#00000010', fontWeight: 700 }} />}
        </Stack>

        {/* Outcome */}
        <AnimatePresence>
          {(outcome === 'fast' || outcome === 'slow') && (
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
                  {outcome === 'fast' ? t('tooFast') : t('tooSlow')}
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.physics, mb: 1 }}>
            🔧 {t('controls')}
          </Typography>

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('velocity')}: {velocity} m/s
            </Typography>
            <Slider
              value={velocity}
              onChange={(_, v) => setVelocity(v as number)}
              min={1}
              max={12}
              step={0.5}
              disabled={running}
              sx={{ color: colors.physics }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              💡 {t('predict', { v: velocity, time: predictedTime })}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleGo}
              disabled={running}
              fullWidth
              sx={{ bgcolor: colors.physics, '&:hover': { bgcolor: colors.physicsLight } }}
            >
              🚗 {t('go')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={running}
              fullWidth
              sx={{ borderColor: colors.physics, color: colors.physics }}
            >
              🔄 {t('reset')}
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2 }}>
            📐 {t('lesson')}
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
