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
import type { RampOutcome } from './RampCanvas';

const RampCanvas = dynamic(() => import('./RampCanvas'), { ssr: false });

export default function RampLabPage() {
  const t = useTranslations('games.rampLab');
  const { playWin, playWhoosh, playWrong } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [angle, setAngle] = useState(30);
  const [friction, setFriction] = useState(0.1);
  const [ballMass, setBallMass] = useState(1);
  const [runToken, setRunToken] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [outcome, setOutcome] = useState<RampOutcome | null>(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);

  const launchCountRef = useRef(0);
  const attemptsRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearSettleTimer(), []);

  const clearSettleTimer = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
  };

  const handleLaunch = () => {
    playWhoosh();
    clearSettleTimer();
    attemptsRef.current += 1;
    launchCountRef.current += 1;
    setOutcome(null);
    setSpeed(0);
    setDistance(0);
    setIsRunning(true);
    setRunToken(launchCountRef.current);
  };

  const handleReset = () => {
    clearSettleTimer();
    setIsRunning(false);
    setOutcome(null);
    setSpeed(0);
    setDistance(0);
    setRunToken(0);
  };

  const handleRunEnd = (result: RampOutcome) => {
    setIsRunning(false);
    setOutcome(result);
    // Let the ball rest where it ended for a moment, then rearm at the top
    clearSettleTimer();
    settleTimerRef.current = setTimeout(() => setRunToken(0), 1200);
    if (result === 'hit') {
      playWin();
      const points = attemptsRef.current === 1 ? 100 : 50;
      const stars = attemptsRef.current === 1 ? 3 : 2;
      attemptsRef.current = 0;
      setLastPoints(points);
      setScore((s) => {
        const next = s + points;
        updateGameProgress('ramp-lab', { highScore: next, stars, currentLevel: 1 });
        return next;
      });
      addXp(points);
      setShowCelebration(true);
    } else {
      playWrong();
    }
  };

  const handlePhysicsUpdate = (s: number, d: number) => {
    setSpeed(s);
    setDistance(d);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} color={colors.physics} title={t('title')} />

      <Container maxWidth="sm" sx={{ pt: 2 }}>
        {/* Physics canvas */}
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
          <RampCanvas
            angle={angle}
            friction={friction}
            ballMass={ballMass}
            runToken={runToken}
            surfaceLabels={{ ice: t('surfaceIce'), wood: t('surfaceWood'), sand: t('surfaceSand') }}
            onRunEnd={handleRunEnd}
            onPhysicsUpdate={handlePhysicsUpdate}
          />
        </Box>

        {/* Measurements — real units: the canvas world is 50 px per meter */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center' }}>
          <Chip
            label={`${t('speed')}: ${speed} m/s`}
            sx={{ bgcolor: `${colors.physics}22`, color: colors.physics, fontWeight: 700 }}
          />
          <Chip
            label={`${t('distance')}: ${distance} m`}
            sx={{ bgcolor: `${colors.physics}22`, color: colors.physics, fontWeight: 700 }}
          />
        </Stack>

        {/* Outcome feedback */}
        <AnimatePresence>
          {outcome && outcome !== 'hit' && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
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
                  {outcome === 'stuck' ? t('stuck') : t('short')}
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

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('angle')}: {angle}°
            </Typography>
            <Slider
              value={angle}
              onChange={(_, v) => setAngle(v as number)}
              min={10}
              max={70}
              disabled={isRunning}
              sx={{ color: colors.physics }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('friction')}: {friction.toFixed(2)}
            </Typography>
            <Slider
              value={friction}
              onChange={(_, v) => setFriction(v as number)}
              min={0}
              max={0.5}
              step={0.05}
              disabled={isRunning}
              marks={[
                { value: 0.05, label: '🧊' },
                { value: 0.2, label: '🪵' },
                { value: 0.4, label: '🏖️' },
              ]}
              sx={{ color: colors.physics }}
            />
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('mass')}: {ballMass} kg
            </Typography>
            <Slider
              value={ballMass}
              onChange={(_, v) => setBallMass(v as number)}
              min={0.5}
              max={5}
              step={0.5}
              disabled={isRunning}
              sx={{ color: colors.physics }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              💡 {t('massFact')}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleLaunch}
              disabled={isRunning}
              fullWidth
              sx={{ bgcolor: colors.physics, '&:hover': { bgcolor: colors.physicsLight } }}
            >
              🚀 {t('launch')}
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth
              sx={{ borderColor: colors.physics, color: colors.physics }}
            >
              🔄 {t('reset')}
            </Button>
          </Stack>
        </Box>
      </Container>

      <RewardCelebration
        show={showCelebration}
        message={t('hit')}
        xpGained={lastPoints}
        stars={lastPoints === 100 ? 3 : 2}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
