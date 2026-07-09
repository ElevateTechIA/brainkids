'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import GameHUD from '@/components/game/GameHUD';
import RewardCelebration from '@/components/game/RewardCelebration';
import UnlockModuleModal from '@/components/tokens/UnlockModuleModal';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { useUnlocks } from '@/lib/hooks/useTokens';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useGameSounds } from '@/lib/hooks/useGameSounds';
import {
  getLevel,
  LABYRINTH_LEVELS,
  levelCount,
} from '@/lib/game/labyrinth/levels';
import type { AttemptOutcome } from '@/lib/game/labyrinth/types';

const MazeCanvas = dynamic(() => import('./MazeCanvas'), { ssr: false });

const SUBJECT_COLOR = '#f39c12';
const SUBJECT_COLOR_LIGHT = '#fcd29f';

export default function LabyrinthsPage() {
  const t = useTranslations('labyrinths');
  const { palette } = useTheme();
  const unlocks = useUnlocks();
  const { playWin, playWhoosh, playWrong } = useGameSounds();
  const addXp = usePlayerStore((s) => s.addXp);
  const updateGameProgress = usePlayerStore((s) => s.updateGameProgress);

  const [levelIndex, setLevelIndex] = useState(0);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [feedback, setFeedback] = useState<AttemptOutcome | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const level = useMemo(() => getLevel(levelIndex), [levelIndex]);
  const labyrinthUnlocked = unlocks.has('labyrinth');
  const isLocked = level.unlockCost > 0 && !labyrinthUnlocked;

  const attemptsLeft = Math.max(0, level.maxAttempts - attemptsUsed);

  const goNextLevel = useCallback(() => {
    const next = (levelIndex + 1) % levelCount();
    setLevelIndex(next);
    setAttemptsUsed(0);
    setFeedback(null);
    setResetKey((k) => k + 1);
  }, [levelIndex]);

  const restartLevel = useCallback(() => {
    setAttemptsUsed(0);
    setFeedback(null);
    setResetKey((k) => k + 1);
  }, []);

  const continueAfterAttempt = useCallback(() => {
    setFeedback(null);
    setResetKey((k) => k + 1);
  }, []);

  const handleAttempt = useCallback(
    (outcome: AttemptOutcome) => {
      if (outcome === 'won') {
        playWin();
        const points = 50 + level.difficulty.length * 10;
        setScore((s) => s + points);
        addXp(points);
        updateGameProgress('labyrinths', {
          highScore: score + points,
          stars: outcome === 'won' && attemptsUsed === 0 ? 3 : 2,
          currentLevel: levelIndex + 1,
        });
        setFeedback('won');
        setShowCelebration(true);
      } else {
        playWrong();
        setAttemptsUsed((a) => a + 1);
        setFeedback(outcome);
      }
    },
    [
      addXp,
      attemptsUsed,
      level.difficulty,
      levelIndex,
      playWin,
      playWrong,
      score,
      updateGameProgress,
    ],
  );

  const onCanvasClick = () => {
    if (isLocked) {
      setUnlockOpen(true);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: palette.background }}>
      <GameHUD
        score={score}
        level={levelIndex + 1}
        color={SUBJECT_COLOR}
        title="Labyrinthes"
      />

      <Container maxWidth="sm" sx={{ pt: 2, pb: 4 }}>
        {/* Level banner */}
        <motion.div
          key={level.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Box
            sx={{
              borderRadius: 3,
              px: 2.5,
              py: 1.5,
              mb: 2,
              background: `linear-gradient(135deg, ${SUBJECT_COLOR}, ${SUBJECT_COLOR_LIGHT})`,
              color: 'white',
              boxShadow: `0 4px 16px ${SUBJECT_COLOR}55`,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600 }}>
                  {t('levelOf', { current: levelIndex + 1, total: levelCount() })}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {level.name}
                </Typography>
              </Box>
              <Chip
                label={t(`difficulty.${level.difficulty}`)}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 700,
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              />
            </Stack>
          </Box>
        </motion.div>

        {/* Attempts */}
        <Stack direction="row" spacing={1} sx={{ mb: 1.5, justifyContent: 'center' }}>
          {Array.from({ length: level.maxAttempts }).map((_, i) => {
            const used = i < attemptsUsed;
            return (
              <Box
                key={i}
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  bgcolor: used ? '#ff6b6b' : SUBJECT_COLOR,
                  opacity: used ? 0.4 : 1,
                  border: `2px solid ${used ? '#c0392b' : '#a05a00'}`,
                  transition: 'all 0.2s',
                }}
              />
            );
          })}
        </Stack>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mb: 1.5,
            color: palette.textSecondary,
            fontWeight: 600,
          }}
        >
          {t('attemptsLeft', { count: attemptsLeft })}
        </Typography>

        {/* Canvas */}
        <Box
          onClick={onCanvasClick}
          sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            mx: 'auto',
            width: '100%',
            maxWidth: 360,
            aspectRatio: `${level.width} / ${level.height}`,
            bgcolor: '#fff7e6',
            mb: 2,
          }}
        >
          <MazeCanvas
            level={level}
            themeColor={SUBJECT_COLOR}
            themeColorLight={SUBJECT_COLOR_LIGHT}
            isLocked={isLocked}
            resetKey={resetKey}
            onAttemptComplete={handleAttempt}
          />
        </Box>

        {/* Feedback + actions */}
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={`${feedback}-${attemptsUsed}-${resetKey}`}
          >
            <Box
              sx={{
                bgcolor: palette.cardBg,
                borderRadius: 3,
                p: 2,
                border: `2px solid ${
                  feedback === 'won'
                    ? '#00b894'
                    : attemptsLeft === 0
                      ? '#ff6b6b'
                      : SUBJECT_COLOR
                }`,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                {feedback === 'won'
                  ? t('won')
                  : feedback === 'stuck'
                    ? t('stuck')
                    : t('out')}
              </Typography>

              {feedback === 'won' ? (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => {
                    setShowCelebration(false);
                    goNextLevel();
                  }}
                  sx={{
                    bgcolor: SUBJECT_COLOR,
                    '&:hover': { bgcolor: SUBJECT_COLOR_LIGHT },
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  ▶ {t('nextLevel')}
                </Button>
              ) : attemptsLeft === 0 ? (
                <Stack direction="row" spacing={1.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={restartLevel}
                    sx={{ borderColor: SUBJECT_COLOR, color: SUBJECT_COLOR, fontWeight: 700 }}
                  >
                    {t('tryAgain')}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      playWhoosh();
                      goNextLevel();
                    }}
                    sx={{
                      bgcolor: SUBJECT_COLOR,
                      '&:hover': { bgcolor: SUBJECT_COLOR_LIGHT },
                      fontWeight: 700,
                    }}
                  >
                    {t('newLabyrinth')}
                  </Button>
                </Stack>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={continueAfterAttempt}
                  sx={{
                    bgcolor: SUBJECT_COLOR,
                    '&:hover': { bgcolor: SUBJECT_COLOR_LIGHT },
                    fontWeight: 700,
                  }}
                >
                  {t('continue')}
                </Button>
              )}
            </Box>
          </motion.div>
        )}

        {/* Locked CTA */}
        {isLocked && !feedback && (
          <Box
            sx={{
              bgcolor: palette.cardBg,
              borderRadius: 3,
              p: 2,
              border: `2px dashed ${SUBJECT_COLOR}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ mb: 1.5, color: palette.textSecondary }}>
              {t('lockedHint')}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setUnlockOpen(true)}
              sx={{
                bgcolor: SUBJECT_COLOR,
                '&:hover': { bgcolor: SUBJECT_COLOR_LIGHT },
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              🔓 {t('unlockCta')}
            </Button>
          </Box>
        )}

        {/* Level switcher (only shown unlocked or for level 1) */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: palette.textSecondary, ml: 1 }}
          >
            {t('selectLevel')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap', gap: 1 }}>
            {LABYRINTH_LEVELS.map((lvl, idx) => {
              const locked = lvl.unlockCost > 0 && !labyrinthUnlocked;
              const active = idx === levelIndex;
              return (
                <Chip
                  key={lvl.id}
                  label={`${idx + 1}. ${lvl.name}${locked ? ' 🔒' : ''}`}
                  onClick={() => {
                    if (locked) {
                      setUnlockOpen(true);
                      return;
                    }
                    setLevelIndex(idx);
                    setAttemptsUsed(0);
                    setFeedback(null);
                    setResetKey((k) => k + 1);
                  }}
                  sx={{
                    bgcolor: active ? SUBJECT_COLOR : `${SUBJECT_COLOR}1a`,
                    color: active ? 'white' : SUBJECT_COLOR,
                    fontWeight: 700,
                    opacity: locked ? 0.7 : 1,
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Container>

      <RewardCelebration
        show={showCelebration}
        message={t('won')}
        xpGained={50}
        stars={attemptsUsed === 0 ? 3 : 2}
        onComplete={() => setShowCelebration(false)}
      />

      <UnlockModuleModal
        open={unlockOpen}
        moduleId={unlockOpen ? 'labyrinth' : null}
        moduleTitle="Labyrinthes"
        moduleColor={SUBJECT_COLOR}
        onClose={() => setUnlockOpen(false)}
      />
    </Box>
  );
}
