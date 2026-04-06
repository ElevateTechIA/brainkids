'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Container, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
import { generateProblem, generateChoices, MathProblem } from '@/lib/game/content/math-problems';
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

const ROUNDS_PER_GAME = 10;

const monsterEmojis = ['😋', '🤩', '😍', '🥳'];
const wrongEmojis = ['😅', '🤢', '😖'];
const idleEmojis = ['🤤', '😊', '🤗'];

export default function NumberMonsterGame() {
  const t = useTranslations('game');
  const { playCorrect, playWrong, playTap, playWin, playPerfect } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [difficulty, setDifficulty] = useState<DifficultyState>(createDifficultyState(1));
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [monsterFace, setMonsterFace] = useState('🤗');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const setupRound = useCallback((diff: DifficultyState) => {
    const p = generateProblem(diff.level);
    setProblem(p);
    setChoices(generateChoices(p.answer, 4));
    setFeedback(null);
    setSelectedChoice(null);
    setMonsterFace(idleEmojis[Math.floor(Math.random() * idleEmojis.length)]);
  }, []);

  useEffect(() => {
    setupRound(difficulty);
  }, []);

  const handleChoice = (choice: number) => {
    if (feedback || !problem) return;

    setSelectedChoice(choice);
    const correct = choice === problem.answer;

    if (correct) {
      playCorrect();
      setFeedback('correct');
      setMonsterFace(monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)]);
      setScore((s) => s + 10 * difficulty.level);
    } else {
      playWrong();
      setFeedback('wrong');
      setMonsterFace(wrongEmojis[Math.floor(Math.random() * wrongEmojis.length)]);
    }

    const newDiff = updateDifficulty(difficulty, correct);
    setDifficulty(newDiff);

    setTimeout(() => {
      if (round >= ROUNDS_PER_GAME) {
        endGame(newDiff);
      } else {
        setRound((r) => r + 1);
        setupRound(newDiff);
      }
    }, 1500);
  };

  const endGame = (finalDiff: DifficultyState) => {
    const accuracy = getAccuracy(finalDiff);
    const stars = calculateStars(accuracy, finalDiff.level);
    const xp = calculateXp(score, stars, finalDiff.level);
    addXp(xp);
    updateGameProgress('number-monster', { highScore: score, stars, currentLevel: finalDiff.level });
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

  if (!problem) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} level={difficulty.level} color={colors.math} title="Monstruo de Numeros" />

      <Container maxWidth="sm" sx={{ pt: 3, textAlign: 'center' }}>
        <Chip label={`${round} / ${ROUNDS_PER_GAME}`} size="small" sx={{ mb: 2, fontWeight: 700 }} />

        {/* Monster */}
        <motion.div
          animate={
            feedback === 'correct'
              ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }
              : feedback === 'wrong'
              ? { x: [0, -10, 10, -10, 0] }
              : { y: [0, -5, 0] }
          }
          transition={
            feedback
              ? { duration: 0.5 }
              : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
          }
        >
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: feedback === 'correct'
                ? `linear-gradient(135deg, ${colors.success}, ${colors.readingLight})`
                : feedback === 'wrong'
                ? `linear-gradient(135deg, ${colors.error}, ${colors.secondaryLight})`
                : `linear-gradient(135deg, ${colors.math}, ${colors.mathLight})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: `0 8px 24px ${colors.math}44`,
              transition: 'background 0.3s',
            }}
          >
            <Typography sx={{ fontSize: '4rem' }}>{monsterFace}</Typography>
          </Box>
        </motion.div>

        {/* Problem */}
        <motion.div
          key={`${problem.display}-${round}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 4,
              p: 3,
              mb: 4,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: colors.math }}>
              {problem.display} = ?
            </Typography>
          </Box>
        </motion.div>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: feedback === 'correct' ? colors.success : colors.error,
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {feedback === 'correct'
                  ? [t('correct'), t('great'), t('awesome')][Math.floor(Math.random() * 3)]
                  : `${t('tryAgain')} = ${problem.answer}`}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choices (floating bubbles) */}
        {!gameOver && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
              maxWidth: 320,
              mx: 'auto',
            }}
          >
            {choices.map((choice, idx) => {
              const isSelected = selectedChoice === choice;
              const isCorrect = feedback && choice === problem.answer;
              const isWrong = isSelected && feedback === 'wrong';

              return (
                <motion.div
                  key={`${choice}-${idx}`}
                  whileHover={{ scale: feedback ? 1 : 1.08 }}
                  whileTap={{ scale: feedback ? 1 : 0.92 }}
                  animate={
                    !feedback
                      ? { y: [0, -4, 0], transition: { repeat: Infinity, duration: 1.5 + idx * 0.3 } }
                      : {}
                  }
                >
                  <Box
                    onClick={() => handleChoice(choice)}
                    sx={{
                      width: '100%',
                      height: 72,
                      borderRadius: '20px',
                      bgcolor: isCorrect
                        ? colors.success
                        : isWrong
                        ? colors.error
                        : 'white',
                      color: isCorrect || isWrong ? 'white' : colors.textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: feedback ? 'default' : 'pointer',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      border: `2px solid ${isCorrect ? colors.success : isWrong ? colors.error : colors.math}33`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {choice}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        )}

        {/* Game Over */}
        {gameOver && !showCelebration && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Puntuacion: {score}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              Precision: {getAccuracy(difficulty)}%
            </Typography>
            <Button variant="contained" onClick={restart} size="large" sx={{ bgcolor: colors.math }}>
              {t('playAgain')}
            </Button>
          </Box>
        )}
      </Container>

      <RewardCelebration
        show={showCelebration}
        message={getAccuracy(difficulty) >= 70 ? '🧮 Genio Matematico!' : '🧮 Sigue practicando!'}
        xpGained={calculateXp(score, calculateStars(getAccuracy(difficulty), difficulty.level), difficulty.level)}
        stars={calculateStars(getAccuracy(difficulty), difficulty.level)}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
