'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Box, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

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

  useEffect(() => {
    if (!show) return;
    playStar();

    const duration = 2000;
    const end = Date.now() + duration;
    let rafId = 0;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#ffd93d', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#00b894'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#ffd93d', '#ff6b6b', '#4ecdc4', '#6c5ce7', '#00b894'],
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
  }, [show, playStar]);

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
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
          >
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 4,
                p: 4,
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <Typography variant="h2" sx={{ mb: 1 }}>
                {'⭐'.repeat(stars || 1)}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
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
                    sx={{ color: '#ffd93d', fontWeight: 700 }}
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
