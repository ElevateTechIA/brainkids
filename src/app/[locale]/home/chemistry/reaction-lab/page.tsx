'use client';

import { useState, useCallback } from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';

interface Reaction {
  substance1: string;
  substance2: string;
  result: string;
  emoji: string;
  animation: 'fizz' | 'dissolve' | 'colorChange' | 'separate' | 'curdle' | 'bigFizz';
  resultColor: string;
}

const reactions: Reaction[] = [
  {
    substance1: 'Vinagre',
    substance2: 'Bicarbonato',
    result: 'Burbujas de CO2!',
    emoji: '🫧',
    animation: 'fizz',
    resultColor: '#e8f5e9',
  },
  {
    substance1: 'Agua',
    substance2: 'Sal',
    result: 'Agua salada',
    emoji: '🌊',
    animation: 'dissolve',
    resultColor: '#e3f2fd',
  },
  {
    substance1: 'Hierro',
    substance2: 'Oxigeno',
    result: 'Oxido / Herrumbre',
    emoji: '🟤',
    animation: 'colorChange',
    resultColor: '#ff8a65',
  },
  {
    substance1: 'Agua',
    substance2: 'Aceite',
    result: 'No se mezclan!',
    emoji: '🔀',
    animation: 'separate',
    resultColor: '#fff9c4',
  },
  {
    substance1: 'Leche',
    substance2: 'Limon',
    result: 'Leche cortada',
    emoji: '🥛',
    animation: 'curdle',
    resultColor: '#fce4ec',
  },
  {
    substance1: 'Mentos',
    substance2: 'Coca Cola',
    result: 'Explosion de burbujas!',
    emoji: '🌋',
    animation: 'bigFizz',
    resultColor: '#4e342e',
  },
];

const allSubstances = [...new Set(reactions.flatMap((r) => [r.substance1, r.substance2]))];

const substanceEmojis: Record<string, string> = {
  Vinagre: '🍶',
  Bicarbonato: '🧂',
  Agua: '💧',
  Sal: '🧂',
  Hierro: '🔩',
  Oxigeno: '💨',
  Aceite: '🫒',
  Leche: '🥛',
  Limon: '🍋',
  Mentos: '🍬',
  'Coca Cola': '🥤',
};

function Bubble({ delay, left }: { delay: number; left: number }) {
  return (
    <motion.div
      initial={{ y: 0, opacity: 0.8, scale: 0.5 }}
      animate={{ y: -120, opacity: 0, scale: 1 }}
      transition={{ duration: 1.5, delay, repeat: Infinity, repeatDelay: 0.5 }}
      style={{
        position: 'absolute',
        bottom: 10,
        left: `${left}%`,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(255,255,255,0.9)',
      }}
    />
  );
}

export default function ReactionLabGame() {
  const t = useTranslations('game');
  const { playCorrect, playWrong, playPop, playWin, playWhoosh } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [beaker1, setBeaker1] = useState<string | null>(null);
  const [beaker2, setBeaker2] = useState<string | null>(null);
  const [currentReaction, setCurrentReaction] = useState<Reaction | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [reactionsFound, setReactionsFound] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const findReaction = (s1: string, s2: string): Reaction | null => {
    return reactions.find(
      (r) =>
        (r.substance1 === s1 && r.substance2 === s2) ||
        (r.substance1 === s2 && r.substance2 === s1)
    ) || null;
  };

  const handleSubstanceTap = (substance: string) => {
    if (showResult) return;

    playPop();

    if (!beaker1) {
      setBeaker1(substance);
    } else if (!beaker2 && substance !== beaker1) {
      setBeaker2(substance);

      // Check for reaction
      const reaction = findReaction(beaker1, substance);
      if (reaction) {
        playCorrect();
        setCurrentReaction(reaction);
        setShowResult(true);
        const reactionKey = `${reaction.substance1}-${reaction.substance2}`;

        if (!reactionsFound.includes(reactionKey)) {
          const newFound = [...reactionsFound, reactionKey];
          setReactionsFound(newFound);
          setScore((s) => s + 20);

          // Check if all reactions found
          if (newFound.length === reactions.length) {
            setTimeout(() => {
              endGame();
            }, 2500);
          }
        }
      } else {
        playWrong();
        setCurrentReaction(null);
        setShowResult(true);
      }
    }
  };

  const resetBeakers = () => {
    setBeaker1(null);
    setBeaker2(null);
    setCurrentReaction(null);
    setShowResult(false);
  };

  const endGame = () => {
    const xp = score * 2 + 30;
    addXp(xp);
    updateGameProgress('reaction-lab', { highScore: score, stars: 3, currentLevel: 1 });
    playWin();
    setShowCelebration(true);
    setGameOver(true);
  };

  const restart = () => {
    setScore(0);
    setReactionsFound([]);
    setGameOver(false);
    setShowCelebration(false);
    resetBeakers();
  };

  const renderAnimationContent = (reaction: Reaction) => {
    switch (reaction.animation) {
      case 'fizz':
      case 'bigFizz':
        return (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {[0, 0.2, 0.4, 0.6, 0.1, 0.3, 0.5, 0.7].map((delay, i) => (
              <Bubble key={i} delay={delay} left={10 + i * 11} />
            ))}
          </Box>
        );
      case 'dissolve':
        return (
          <motion.div
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.95, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'colorChange':
        return (
          <motion.div
            animate={{ backgroundColor: ['#e3f2fd', '#ff8a65', '#bf360c'] }}
            transition={{ duration: 2 }}
            style={{ width: '100%', height: '100%', borderRadius: 16 }}
          />
        );
      case 'separate':
        return (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <motion.div
              animate={{ y: [-5, 0] }}
              transition={{ duration: 1 }}
              style={{ flex: 1, background: '#fff9c4', borderRadius: '16px 16px 0 0' }}
            />
            <motion.div
              animate={{ y: [5, 0] }}
              transition={{ duration: 1 }}
              style={{ flex: 1, background: '#bbdefb', borderRadius: '0 0 16px 16px' }}
            />
          </Box>
        );
      case 'curdle':
        return (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            {[20, 40, 60, 30, 55, 75].map((left, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  bottom: 10 + i * 8,
                  left: `${left}%`,
                  width: 16 + i * 2,
                  height: 16 + i * 2,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                }}
              />
            ))}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} color={colors.chemistry} title="Lab de Reacciones" />

      <Container maxWidth="sm" sx={{ pt: 3, textAlign: 'center' }}>
        {/* Progress */}
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontWeight: 600 }}>
          Reacciones descubiertas: {reactionsFound.length} / {reactions.length}
        </Typography>

        {/* Beakers */}
        <Stack direction="row" spacing={3} sx={{ justifyContent: 'center', mb: 3 }}>
          {/* Beaker 1 */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <Box
              sx={{
                width: 140,
                height: 160,
                bgcolor: beaker1 && showResult && currentReaction ? currentReaction.resultColor : 'white',
                borderRadius: '16px 16px 24px 24px',
                border: `3px solid ${colors.chemistry}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'background-color 1s',
              }}
            >
              {showResult && currentReaction && renderAnimationContent(currentReaction)}
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem' }}>
                  {beaker1 ? substanceEmojis[beaker1] || '🧪' : '🧪'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {beaker1 || 'Vacio'}
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* Plus sign */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.chemistry }}>
              +
            </Typography>
          </Box>

          {/* Beaker 2 */}
          <motion.div whileHover={{ scale: 1.02 }}>
            <Box
              sx={{
                width: 140,
                height: 160,
                bgcolor: beaker2 && showResult && currentReaction ? currentReaction.resultColor : 'white',
                borderRadius: '16px 16px 24px 24px',
                border: `3px solid ${colors.chemistry}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'background-color 1s',
              }}
            >
              {showResult && currentReaction && renderAnimationContent(currentReaction)}
              <Box sx={{ position: 'absolute', textAlign: 'center' }}>
                <Typography sx={{ fontSize: '2rem' }}>
                  {beaker2 ? substanceEmojis[beaker2] || '🧪' : '🧪'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {beaker2 || 'Vacio'}
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Stack>

        {/* Reaction result */}
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}>
              <Box
                sx={{
                  bgcolor: currentReaction ? `${colors.success}22` : `${colors.error}22`,
                  borderRadius: 3,
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: currentReaction ? colors.success : colors.error,
                  }}
                >
                  {currentReaction
                    ? `${currentReaction.emoji} ${currentReaction.result}`
                    : '❌ No hay reaccion... Prueba otra combinacion!'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={resetBeakers}
                sx={{ bgcolor: colors.chemistry, '&:hover': { bgcolor: colors.chemistryLight } }}
              >
                Siguiente experimento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Substance shelf */}
        {!gameOver && !showResult && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.chemistry, mb: 1.5 }}>
              🧴 Estante de sustancias
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1.5,
                maxWidth: 360,
                mx: 'auto',
              }}
            >
              {allSubstances.map((substance, idx) => {
                const isSelected = beaker1 === substance;

                return (
                  <motion.div
                    key={substance}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Box
                      onClick={() => handleSubstanceTap(substance)}
                      sx={{
                        bgcolor: isSelected ? `${colors.chemistry}22` : 'white',
                        border: `2px solid ${isSelected ? colors.chemistry : colors.chemistry + '33'}`,
                        borderRadius: '16px',
                        p: 1.5,
                        cursor: 'pointer',
                        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: colors.chemistry,
                          bgcolor: `${colors.chemistry}11`,
                        },
                      }}
                    >
                      <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                        {substanceEmojis[substance] || '🧪'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                        {substance}
                      </Typography>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Discovered reactions list */}
        {reactionsFound.length > 0 && !showResult && (
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1 }}>
              Descubrimientos:
            </Typography>
            <Stack spacing={0.5}>
              {reactionsFound.map((key) => {
                const reaction = reactions.find(
                  (r) => `${r.substance1}-${r.substance2}` === key
                );
                if (!reaction) return null;
                return (
                  <Typography key={key} variant="body2" sx={{ color: 'text.secondary' }}>
                    {reaction.emoji} {reaction.substance1} + {reaction.substance2} = {reaction.result}
                  </Typography>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Game over */}
        {gameOver && !showCelebration && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Todas las reacciones descubiertas!
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              Puntuacion: {score}
            </Typography>
            <Button
              variant="contained"
              onClick={restart}
              size="large"
              sx={{ bgcolor: colors.chemistry, '&:hover': { bgcolor: colors.chemistryLight } }}
            >
              {t('playAgain')}
            </Button>
          </Box>
        )}
      </Container>

      <RewardCelebration
        show={showCelebration}
        message="🔬 Cientifico Estrella!"
        xpGained={score * 2 + 30}
        stars={3}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
