'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Container, Slider, Button, Chip, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import dynamic from 'next/dynamic';

const RampCanvas = dynamic(() => import('./RampCanvas'), { ssr: false });

export default function RampLabPage() {
  const t = useTranslations('game');
  const { playWin, playWhoosh } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [angle, setAngle] = useState(30);
  const [friction, setFriction] = useState(0.1);
  const [ballMass, setBallMass] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [challengeMode, setChallengeMode] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [distance, setDistance] = useState(0);

  const handleLaunch = () => {
    playWhoosh();
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSpeed(0);
    setDistance(0);
  };

  const handleBallReachedTarget = useCallback(() => {
    playWin();
    const points = 50;
    setScore((s) => s + points);
    addXp(points);
    updateGameProgress('ramp-lab', { highScore: score + points, stars: 2, currentLevel: 1 });
    setShowCelebration(true);
  }, [score, addXp, updateGameProgress, playWin]);

  const handlePhysicsUpdate = useCallback((s: number, d: number) => {
    setSpeed(Math.round(s * 10) / 10);
    setDistance(Math.round(d));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} color={colors.physics} title="Lab de Rampas" />

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
            isRunning={isRunning}
            onBallReachedTarget={handleBallReachedTarget}
            onPhysicsUpdate={handlePhysicsUpdate}
          />
        </Box>

        {/* Measurements */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center' }}>
          <Chip
            label={`Velocidad: ${speed} m/s`}
            sx={{ bgcolor: `${colors.physics}22`, color: colors.physics, fontWeight: 700 }}
          />
          <Chip
            label={`Distancia: ${distance} px`}
            sx={{ bgcolor: `${colors.physics}22`, color: colors.physics, fontWeight: 700 }}
          />
        </Stack>

        {/* Controls */}
        <Box sx={{ bgcolor: 'white', borderRadius: 4, p: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.physics, mb: 1 }}>
            🔧 Controles
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Angulo de rampa: {angle}°
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
              Friccion: {friction.toFixed(2)}
            </Typography>
            <Slider
              value={friction}
              onChange={(_, v) => setFriction(v as number)}
              min={0}
              max={0.5}
              step={0.05}
              disabled={isRunning}
              sx={{ color: colors.physics }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Masa de bola: {ballMass} kg
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
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleLaunch}
              disabled={isRunning}
              fullWidth
              sx={{ bgcolor: colors.physics, '&:hover': { bgcolor: colors.physicsLight } }}
            >
              🚀 Lanzar
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth
              sx={{ borderColor: colors.physics, color: colors.physics }}
            >
              🔄 Reiniciar
            </Button>
          </Stack>
        </Box>
      </Container>

      <RewardCelebration
        show={showCelebration}
        message="🎯 En la canasta!"
        xpGained={50}
        stars={2}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
