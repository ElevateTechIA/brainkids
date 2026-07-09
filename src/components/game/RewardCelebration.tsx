'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';
import { useTheme } from '@/lib/theme/ThemeProvider';

interface RewardCelebrationProps {
  show: boolean;
  message?: string;
  xpGained?: number;
  stars?: number;
  onComplete?: () => void;
}

export default function RewardCelebration({
  show,
  message = 'Genial!',
  xpGained = 0,
  stars = 0,
  onComplete,
}: RewardCelebrationProps) {
  const [playStar] = useSound('/sounds/star.ogg', { volume: 0.6 });
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const { palette, themeName } = useTheme();
  const isPlatinum = themeName === 'platinum';

  useEffect(() => {
    if (!show) return;
    playStar();

    const duration = 2000;
    const end = Date.now() + duration;
    let rafId = 0;

    const colors = isPlatinum
      ? ['#C3F54C', '#DCFA6E', '#C8B88A', '#9F9AAB', '#FFFFFF']
      : ['#ffd93d', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#00b894'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        rafId = requestAnimationFrame(frame);
      }
    };
    rafId = requestAnimationFrame(frame);

    const timer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 3000);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      confetti.reset();
    };
  }, [show, playStar, isPlatinum]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            background: isPlatinum ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          >
            <Box
              sx={{
                bgcolor: palette.cardBg,
                border: isPlatinum ? `1px solid ${palette.cardBorder}` : 'none',
                borderRadius: isPlatinum ? 3 : 4,
                p: 4,
                textAlign: 'center',
                minWidth: 280,
                boxShadow: isPlatinum
                  ? `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${palette.cardBorder}, 0 0 40px ${palette.accent}33`
                  : '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <Typography variant="h2" sx={{ mb: 1, fontSize: '2.8rem' }}>
                {'⭐'.repeat(stars || 1)}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: palette.primary,
                  mb: 1,
                  fontFamily: isPlatinum
                    ? 'var(--font-fraunces), serif'
                    : 'var(--font-fredoka), sans-serif',
                  letterSpacing: isPlatinum ? '-0.02em' : 'normal',
                }}
              >
                {message}
              </Typography>
              {xpGained > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: palette.accent,
                      fontWeight: 800,
                      filter: isPlatinum ? `drop-shadow(0 0 8px ${palette.accent})` : 'none',
                    }}
                  >
                    +{xpGained} XP
                  </Typography>
                </motion.div>
              )}
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
