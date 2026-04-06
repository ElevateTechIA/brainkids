'use client';

import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Button, Container, Chip, Stack } from '@mui/material';
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

interface AtomRequirement {
  symbol: string;
  count: number;
}

interface Molecule {
  formula: string;
  name: string;
  atoms: AtomRequirement[];
}

const level1Molecules: Molecule[] = [
  { formula: 'H2O', name: 'Agua', atoms: [{ symbol: 'H', count: 2 }, { symbol: 'O', count: 1 }] },
  { formula: 'CO2', name: 'Dioxido de Carbono', atoms: [{ symbol: 'C', count: 1 }, { symbol: 'O', count: 2 }] },
  { formula: 'NaCl', name: 'Sal', atoms: [{ symbol: 'Na', count: 1 }, { symbol: 'Cl', count: 1 }] },
  { formula: 'O2', name: 'Oxigeno', atoms: [{ symbol: 'O', count: 2 }] },
];

const level2Molecules: Molecule[] = [
  { formula: 'H2O2', name: 'Agua Oxigenada', atoms: [{ symbol: 'H', count: 2 }, { symbol: 'O', count: 2 }] },
  { formula: 'NH3', name: 'Amoniaco', atoms: [{ symbol: 'N', count: 1 }, { symbol: 'H', count: 3 }] },
  { formula: 'CH4', name: 'Metano', atoms: [{ symbol: 'C', count: 1 }, { symbol: 'H', count: 4 }] },
  { formula: 'CaCO3', name: 'Caliza', atoms: [{ symbol: 'Ca', count: 1 }, { symbol: 'C', count: 1 }, { symbol: 'O', count: 3 }] },
];

const atomColors: Record<string, string> = {
  H: '#3498db',
  O: '#e74c3c',
  C: '#2c3e50',
  N: '#2ecc71',
  Na: '#f39c12',
  Cl: '#1abc9c',
  Ca: '#9b59b6',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMoleculesForLevel(level: number): Molecule[] {
  return level >= 2 ? [...level1Molecules, ...level2Molecules] : [...level1Molecules];
}

function getAvailableAtoms(molecule: Molecule): string[] {
  const needed = molecule.atoms.map((a) => a.symbol);
  // Add some distractors
  const allAtoms = ['H', 'O', 'C', 'N', 'Na', 'Cl', 'Ca'];
  const distractors = allAtoms.filter((a) => !needed.includes(a)).slice(0, 2);
  return shuffle([...needed, ...distractors]);
}

const ROUNDS_PER_GAME = 6;

export default function MoleculeBuilderGame() {
  const t = useTranslations('game');
  const { playCorrect, playWrong, playPop, playWin, playPerfect } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [difficulty, setDifficulty] = useState<DifficultyState>(createDifficultyState(1));
  const [currentMolecule, setCurrentMolecule] = useState<Molecule | null>(null);
  const [availableAtoms, setAvailableAtoms] = useState<string[]>([]);
  const [builtAtoms, setBuiltAtoms] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'hint' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const setupRound = useCallback((diff: DifficultyState) => {
    const molecules = getMoleculesForLevel(diff.level);
    const mol = molecules[Math.floor(Math.random() * molecules.length)];
    setCurrentMolecule(mol);
    setAvailableAtoms(getAvailableAtoms(mol));
    setBuiltAtoms([]);
    setFeedback(null);
  }, []);

  useEffect(() => {
    setupRound(difficulty);
  }, []);

  const checkMatch = (atoms: string[], molecule: Molecule): boolean => {
    const counts: Record<string, number> = {};
    atoms.forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
    for (const req of molecule.atoms) {
      if ((counts[req.symbol] || 0) !== req.count) return false;
    }
    // Check no extra atoms
    const totalRequired = molecule.atoms.reduce((sum, a) => sum + a.count, 0);
    return atoms.length === totalRequired;
  };

  const getTotalAtomsNeeded = (molecule: Molecule): number => {
    return molecule.atoms.reduce((sum, a) => sum + a.count, 0);
  };

  const handleAtomTap = (atom: string) => {
    if (feedback || !currentMolecule) return;
    playPop();

    const newBuilt = [...builtAtoms, atom];
    setBuiltAtoms(newBuilt);

    const totalNeeded = getTotalAtomsNeeded(currentMolecule);

    if (newBuilt.length === totalNeeded) {
      // Check the combination
      if (checkMatch(newBuilt, currentMolecule)) {
        playCorrect();
        setFeedback('correct');
        setScore((s) => s + 15 * difficulty.level);
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
        setFeedback('hint');
        const newDiff = updateDifficulty(difficulty, false);
        setDifficulty(newDiff);

        setTimeout(() => {
          setBuiltAtoms([]);
          setFeedback(null);
        }, 2000);
      }
    }
  };

  const handleRemoveAtom = (idx: number) => {
    if (feedback) return;
    const newBuilt = [...builtAtoms];
    newBuilt.splice(idx, 1);
    setBuiltAtoms(newBuilt);
  };

  const endGame = (finalDiff: DifficultyState) => {
    const accuracy = getAccuracy(finalDiff);
    const stars = calculateStars(accuracy, finalDiff.level);
    const xp = calculateXp(score, stars, finalDiff.level);
    addXp(xp);
    updateGameProgress('molecule-builder', { highScore: score, stars, currentLevel: finalDiff.level });
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

  if (!currentMolecule) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <GameHUD score={score} level={difficulty.level} color={colors.chemistry} title="Constructor de Moleculas" />

      <Container maxWidth="sm" sx={{ pt: 3, textAlign: 'center' }}>
        <Chip label={`${round} / ${ROUNDS_PER_GAME}`} size="small" sx={{ mb: 2, fontWeight: 700 }} />

        {/* Target molecule */}
        <motion.div
          key={`${currentMolecule.formula}-${round}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 4,
              p: 3,
              mb: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
              Construye esta molecula:
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: colors.chemistry }}>
              {currentMolecule.formula}
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {currentMolecule.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              {currentMolecule.atoms.map((a) => `${a.count} ${a.symbol}`).join(' + ')}
            </Typography>
          </Box>
        </motion.div>

        {/* Formula builder area */}
        <Box
          sx={{
            bgcolor: 'white',
            borderRadius: 4,
            p: 2,
            mb: 3,
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            flexWrap: 'wrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: feedback === 'correct'
              ? `3px solid ${colors.success}`
              : feedback === 'hint'
              ? `3px solid ${colors.error}`
              : `3px dashed ${colors.chemistry}44`,
            transition: 'border 0.3s',
          }}
        >
          {builtAtoms.length === 0 ? (
            <Typography variant="body1" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Toca los atomos para agregarlos
            </Typography>
          ) : (
            builtAtoms.map((atom, idx) => (
              <motion.div
                key={`${atom}-${idx}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Box
                  onClick={() => handleRemoveAtom(idx)}
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: atomColors[atom] || colors.chemistry,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: `0 4px 12px ${atomColors[atom] || colors.chemistry}44`,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '1.1rem' }}>
                    {atom}
                  </Typography>
                </Box>
              </motion.div>
            ))
          )}
        </Box>

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  color: feedback === 'correct' ? colors.success : colors.error,
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {feedback === 'correct'
                  ? `🎉 ${t('correct')} ${currentMolecule.formula}!`
                  : `💡 Pista: necesitas ${currentMolecule.atoms.map((a) => `${a.count}${a.symbol}`).join(' + ')}`}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available atoms */}
        {!gameOver && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            {availableAtoms.map((atom, idx) => (
              <motion.div
                key={`${atom}-btn-${idx}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 + idx * 0.3, ease: 'easeInOut' }}
              >
                <Box
                  onClick={() => handleAtomTap(atom)}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    border: `3px solid ${atomColors[atom] || colors.chemistry}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: feedback ? 'default' : 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: `${atomColors[atom] || colors.chemistry}11`,
                    },
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: atomColors[atom] || colors.chemistry }}>
                    {atom}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        )}

        {/* Game over */}
        {gameOver && !showCelebration && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Puntuacion: {score}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              Precision: {getAccuracy(difficulty)}%
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
        message={getAccuracy(difficulty) >= 70 ? '🧬 Gran Quimico!' : '🧬 Sigue intentando!'}
        xpGained={calculateXp(score, calculateStars(getAccuracy(difficulty), difficulty.level), difficulty.level)}
        stars={calculateStars(getAccuracy(difficulty), difficulty.level)}
        onComplete={() => setShowCelebration(false)}
      />
    </Box>
  );
}
