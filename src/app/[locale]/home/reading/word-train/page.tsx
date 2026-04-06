'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Container, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { getRandomWord, getLetterChoices } from '@/lib/game/content/reading-words';
import {
  createDifficultyState,
  updateDifficulty,
  getAccuracy,
  calculateStars,
  calculateXp,
  DifficultyState,
} from '@/lib/game/adaptive-difficulty';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useTranslations } from 'next-intl';
import { useGameSounds } from '@/lib/hooks/useGameSounds';

const ROUNDS_PER_GAME = 8;

export default function WordTrainGame() {
  const t = useTranslations('game');
  const { playCorrect, playWrong, playPop, playWin, playPerfect } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [difficulty, setDifficulty] = useState<DifficultyState>(createDifficultyState(1));
  const [currentWord, setCurrentWord] = useState(getRandomWord(1));
  const [letters, setLetters] = useState<string[]>([]);
  const [filledSlots, setFilledSlots] = useState<(string | null)[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);

  const setupRound = useCallback((diff: DifficultyState) => {
    const word = getRandomWord(diff.level);
    setCurrentWord(word);
    setLetters(getLetterChoices(word.word, Math.min(diff.level + 2, 6)));
    setFilledSlots(new Array(word.word.length).fill(null));
    setFeedback(null);
  }, []);

  useEffect(() => {
    setupRound(difficulty);
  }, []);

  const handleLetterTap = (letter: string, letterIdx: number) => {
    if (feedback) return;

    const nextEmpty = filledSlots.findIndex((s) => s === null);
    if (nextEmpty === -1) return;
    playPop();

    const newSlots = [...filledSlots];
    newSlots[nextEmpty] = letter;
    setFilledSlots(newSlots);

    // Remove used letter from choices
    const newLetters = [...letters];
    newLetters[letterIdx] = '';
    setLetters(newLetters);

    // Check if word is complete
    if (newSlots.every((s) => s !== null)) {
      const builtWord = newSlots.join('');
      const correct = builtWord === currentWord.word;

      if (correct) {
        playCorrect();
        setFeedback('correct');
        setScore((s) => s + 10 * difficulty.level);
        const newDiff = updateDifficulty(difficulty, true);
        setDifficulty(newDiff);

        setTimeout(() => {
          if (round >= ROUNDS_PER_GAME) {
            endGame(newDiff);
          } else {
            setRound((r) => r + 1);
            setupRound(newDiff);
          }
        }, 1500);
      } else {
        playWrong();
        setFeedback('wrong');
        setShakeWrong(true);
        const newDiff = updateDifficulty(difficulty, false);
        setDifficulty(newDiff);

        setTimeout(() => {
          setShakeWrong(false);
          if (round >= ROUNDS_PER_GAME) {
            endGame(newDiff);
          } else {
            setRound((r) => r + 1);
            setupRound(newDiff);
          }
        }, 1500);
      }
    }
  };

  const handleSlotTap = (slotIdx: number) => {
    if (feedback) return;
    const letter = filledSlots[slotIdx];
    if (!letter) return;

    // Return letter to choices
    const emptyIdx = letters.findIndex((l) => l === '');
    if (emptyIdx >= 0) {
      const newLetters = [...letters];
      newLetters[emptyIdx] = letter;
      setLetters(newLetters);
    }
    const newSlots = [...filledSlots];
    newSlots[slotIdx] = null;
    setFilledSlots(newSlots);
  };

  const endGame = (finalDiff: DifficultyState) => {
    const accuracy = getAccuracy(finalDiff);
    const stars = calculateStars(accuracy, finalDiff.level);
    const xp = calculateXp(score, stars, finalDiff.level);
    addXp(xp);
    updateGameProgress('word-train', { highScore: score, stars, currentLevel: finalDiff.level });
    if (stars === 3) playPerfect(); else playWin();
    setShowCelebration(true);
    setGameOver(true);
  };

  const restart = () => {
    const newDiff = createDifficultyState(difficulty.level);
    setDifficulty(newDiff);
    setScore(0);
    setRound(1);
    setGameOver(false);
    setShowCelebration(false);
    setupRound(newDiff);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} level={difficulty.level} color={colors.reading} title="Tren de Palabras" />

      <Container maxWidth="sm" sx={{ pt: 3, textAlign: 'center' }}>
        {/* Round indicator */}
        <Chip
          label={`${round} / ${ROUNDS_PER_GAME}`}
          size="small"
          sx={{ mb: 2, fontWeight: 700 }}
        />

        {/* Hint */}
        <motion.div
          key={currentWord.word}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 3, fontStyle: 'italic' }}>
            💡 {currentWord.hint}
          </Typography>
        </motion.div>

        {/* Train wagons (slots) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 4 }}>
          {/* Engine */}
          <motion.div
            animate={feedback === 'correct' ? { x: [0, -5, 5, 0] } : {}}
            transition={{ repeat: feedback === 'correct' ? 3 : 0, duration: 0.15 }}
          >
            <Box
              sx={{
                width: 56,
                height: 72,
                bgcolor: colors.reading,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white',
                boxShadow: `0 4px 12px ${colors.reading}44`,
              }}
            >
              🚂
            </Box>
          </motion.div>

          {/* Wagon slots */}
          {filledSlots.map((letter, idx) => (
            <motion.div
              key={idx}
              animate={
                shakeWrong
                  ? { x: [0, -8, 8, -8, 0], transition: { duration: 0.4 } }
                  : feedback === 'correct'
                  ? { scale: [1, 1.1, 1], transition: { delay: idx * 0.1 } }
                  : {}
              }
            >
              <Box
                onClick={() => handleSlotTap(idx)}
                sx={{
                  width: 56,
                  height: 72,
                  bgcolor: letter
                    ? feedback === 'correct'
                      ? colors.success
                      : feedback === 'wrong'
                      ? colors.error
                      : colors.reading
                    : 'white',
                  border: letter ? 'none' : `3px dashed ${colors.reading}88`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: letter ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: letter ? `0 4px 12px ${colors.reading}44` : 'none',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: letter ? 'white' : colors.reading,
                  }}
                >
                  {letter || '?'}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: feedback === 'correct' ? colors.success : colors.error,
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {feedback === 'correct' ? '🎉 ' + t('correct') : '😅 ' + t('tryAgain')}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Letter choices */}
        {!gameOver && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {letters.map((letter, idx) => (
              <motion.div
                key={`${letter}-${idx}`}
                whileHover={{ scale: letter ? 1.1 : 1 }}
                whileTap={{ scale: letter ? 0.9 : 1 }}
              >
                <Box
                  onClick={() => letter && handleLetterTap(letter, idx)}
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: letter ? 'white' : 'transparent',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: letter ? 'pointer' : 'default',
                    boxShadow: letter ? '0 3px 10px rgba(0,0,0,0.12)' : 'none',
                    border: letter ? `2px solid ${colors.reading}33` : '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': letter
                      ? {
                          bgcolor: `${colors.reading}11`,
                          borderColor: colors.reading,
                        }
                      : {},
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, color: colors.textPrimary }}>
                    {letter}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        )}

        {/* Game over */}
        {gameOver && !showCelebration && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              Puntuacion: {score}
            </Typography>
            <Button variant="contained" onClick={restart} size="large">
              {t('playAgain')}
            </Button>
          </Box>
        )}
      </Container>

      <RewardCelebration
        show={showCelebration}
        message={getAccuracy(difficulty) >= 70 ? '🚂 Genial!' : '🚂 Buen intento!'}
        xpGained={calculateXp(score, calculateStars(getAccuracy(difficulty), difficulty.level), difficulty.level)}
        stars={calculateStars(getAccuracy(difficulty), difficulty.level)}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
