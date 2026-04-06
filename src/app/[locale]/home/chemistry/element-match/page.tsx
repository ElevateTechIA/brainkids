'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Typography, Button, Container, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import { colors } from '@/lib/theme/colors';
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

interface ElementPair {
  symbol: string;
  name: string;
}

const level1Elements: ElementPair[] = [
  { symbol: 'H', name: 'Hidrogeno' },
  { symbol: 'O', name: 'Oxigeno' },
  { symbol: 'C', name: 'Carbono' },
  { symbol: 'N', name: 'Nitrogeno' },
  { symbol: 'Fe', name: 'Hierro' },
  { symbol: 'Au', name: 'Oro' },
  { symbol: 'Ag', name: 'Plata' },
  { symbol: 'Cu', name: 'Cobre' },
  { symbol: 'Na', name: 'Sodio' },
  { symbol: 'K', name: 'Potasio' },
  { symbol: 'Ca', name: 'Calcio' },
  { symbol: 'He', name: 'Helio' },
];

const level2Elements: ElementPair[] = [
  { symbol: 'Cl', name: 'Cloro' },
  { symbol: 'S', name: 'Azufre' },
  { symbol: 'P', name: 'Fosforo' },
  { symbol: 'Mg', name: 'Magnesio' },
  { symbol: 'Zn', name: 'Zinc' },
  { symbol: 'Al', name: 'Aluminio' },
  { symbol: 'Si', name: 'Silicio' },
  { symbol: 'Pb', name: 'Plomo' },
];

interface Card {
  id: string;
  content: string;
  pairId: string;
  type: 'symbol' | 'name';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getElementsForLevel(level: number): ElementPair[] {
  const pool = level >= 2 ? [...level1Elements, ...level2Elements] : [...level1Elements];
  return shuffle(pool).slice(0, 8);
}

function buildCards(elements: ElementPair[]): Card[] {
  const cards: Card[] = [];
  elements.forEach((el) => {
    cards.push({ id: `sym-${el.symbol}`, content: el.symbol, pairId: el.symbol, type: 'symbol' });
    cards.push({ id: `name-${el.symbol}`, content: el.name, pairId: el.symbol, type: 'name' });
  });
  return shuffle(cards);
}

export default function ElementMatchGame() {
  const t = useTranslations('game');
  const { playCorrect, playWrong, playPop, playWin, playPerfect } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [difficulty, setDifficulty] = useState<DifficultyState>(createDifficultyState(1));
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const setupGame = useCallback((diff: DifficultyState) => {
    const elements = getElementsForLevel(diff.level);
    setCards(buildCards(elements));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
  }, []);

  useEffect(() => {
    setupGame(difficulty);
  }, []);

  const handleCardTap = (cardId: string) => {
    if (isChecking) return;
    if (flipped.includes(cardId) || matched.includes(cardId)) return;

    playPop();
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const card1 = cards.find((c) => c.id === newFlipped[0])!;
      const card2 = cards.find((c) => c.id === newFlipped[1])!;

      if (card1.pairId === card2.pairId && card1.type !== card2.type) {
        // Match!
        playCorrect();
        const newMatched = [...matched, card1.id, card2.id];
        setMatched(newMatched);
        setScore((s) => s + 10 * difficulty.level);
        const newDiff = updateDifficulty(difficulty, true);
        setDifficulty(newDiff);

        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);

          // Check if all matched
          if (newMatched.length === cards.length) {
            endGame(newDiff);
          }
        }, 600);
      } else {
        // No match
        playWrong();
        const newDiff = updateDifficulty(difficulty, false);
        setDifficulty(newDiff);

        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const endGame = (finalDiff: DifficultyState) => {
    const accuracy = getAccuracy(finalDiff);
    const stars = calculateStars(accuracy, finalDiff.level);
    const xp = calculateXp(score, stars, finalDiff.level);
    addXp(xp);
    updateGameProgress('element-match', { highScore: score, stars, currentLevel: finalDiff.level });
    if (stars === 3) playPerfect(); else playWin();
    setShowCelebration(true);
    setGameOver(true);
  };

  const restart = () => {
    const newDiff = createDifficultyState(difficulty.level);
    setDifficulty(newDiff);
    setScore(0);
    setGameOver(false);
    setShowCelebration(false);
    setupGame(newDiff);
  };

  const isFlipped = (id: string) => flipped.includes(id) || matched.includes(id);
  const isMatched = (id: string) => matched.includes(id);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} level={difficulty.level} color={colors.chemistry} title="Elementos Match" />

      <Container maxWidth="sm" sx={{ pt: 3, textAlign: 'center' }}>
        <Chip
          label={`Movimientos: ${moves}`}
          size="small"
          sx={{ mb: 2, fontWeight: 700, bgcolor: `${colors.chemistry}22`, color: colors.chemistry }}
        />

        {/* Card grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1.5,
            maxWidth: 360,
            mx: 'auto',
          }}
        >
          {cards.map((card) => {
            const flippedState = isFlipped(card.id);
            const matchedState = isMatched(card.id);

            return (
              <motion.div
                key={card.id}
                whileHover={{ scale: flippedState ? 1 : 1.05 }}
                whileTap={{ scale: flippedState ? 1 : 0.95 }}
                animate={matchedState ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Box
                  onClick={() => handleCardTap(card.id)}
                  sx={{
                    width: '100%',
                    height: 80,
                    borderRadius: '14px',
                    cursor: flippedState ? 'default' : 'pointer',
                    perspective: '600px',
                    position: 'relative',
                  }}
                >
                  <motion.div
                    animate={{ rotateY: flippedState ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {/* Card back */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '14px',
                        bgcolor: colors.chemistry,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backfaceVisibility: 'hidden',
                        boxShadow: `0 4px 12px ${colors.chemistry}44`,
                      }}
                    >
                      <Typography sx={{ fontSize: '1.5rem', color: 'white' }}>?</Typography>
                    </Box>

                    {/* Card front */}
                    <Box
                      sx={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: '14px',
                        bgcolor: matchedState ? colors.success : 'white',
                        border: `2px solid ${matchedState ? colors.success : colors.chemistry}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        p: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: card.type === 'symbol' ? '1.4rem' : '0.75rem',
                          color: matchedState ? 'white' : colors.textPrimary,
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {card.content}
                      </Typography>
                    </Box>
                  </motion.div>
                </Box>
              </motion.div>
            );
          })}
        </Box>

        {/* Game over */}
        {gameOver && !showCelebration && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Puntuacion: {score}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              Movimientos: {moves}
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
        message={getAccuracy(difficulty) >= 70 ? '🧪 Genio Quimico!' : '🧪 Sigue practicando!'}
        xpGained={calculateXp(score, calculateStars(getAccuracy(difficulty), difficulty.level), difficulty.level)}
        stars={calculateStars(getAccuracy(difficulty), difficulty.level)}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
