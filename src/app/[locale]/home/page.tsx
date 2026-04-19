'use client';

import { Box, Container, Typography, Chip, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import SubjectCard from '@/components/layout/SubjectCard';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { colors } from '@/lib/theme/colors';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import { useEffect } from 'react';

export default function DashboardPage() {
  const t = useTranslations();
  const { displayName, xp, level, streak, updateStreak } = usePlayerStore();

  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  const name = displayName || undefined;

  return (
    <Box sx={{ bgcolor: colors.background, minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
          color: 'white',
          p: 3,
          pb: 4,
          borderRadius: '0 0 28px 28px',
        }}
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, pr: 6 }}>
            {name ? t('home.welcome', { name }) : t('home.welcomeDefault')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              label={t('home.level', { level })}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
            />
            <Chip
              label={t('home.xp', { xp })}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
              icon={<Typography sx={{ color: '#ffd93d', pl: 1 }}>⭐</Typography>}
            />
            {streak > 0 && (
              <Chip
                icon={<LocalFireDepartmentRoundedIcon sx={{ color: '#ff6b6b !important' }} />}
                label={t('home.streak', { count: streak })}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }}
              />
            )}
          </Stack>
        </motion.div>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -2, position: 'relative', zIndex: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 3, color: 'text.primary' }}>
          {t('home.chooseSubject')}
        </Typography>

        <Stack spacing={2.5}>
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <SubjectCard
              title={t('subjects.reading.title')}
              description={t('subjects.reading.description')}
              icon={<MenuBookRoundedIcon fontSize="large" />}
              color={colors.reading}
              colorLight={colors.readingLight}
              path="/reading"
              gamesCount={3}
              progress={0}
            />
          </motion.div>

          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <SubjectCard
              title={t('subjects.math.title')}
              description={t('subjects.math.description')}
              icon={<CalculateRoundedIcon fontSize="large" />}
              color={colors.math}
              colorLight={colors.mathLight}
              path="/math"
              gamesCount={3}
              progress={0}
            />
          </motion.div>

          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <SubjectCard
              title={t('subjects.physics.title')}
              description={t('subjects.physics.description')}
              icon={<ScienceRoundedIcon fontSize="large" />}
              color={colors.physics}
              colorLight={colors.physicsLight}
              path="/physics"
              gamesCount={4}
              progress={0}
            />
          </motion.div>

          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <SubjectCard
              title={t('subjects.chemistry.title')}
              description={t('subjects.chemistry.description')}
              icon={<BiotechRoundedIcon fontSize="large" />}
              color={colors.chemistry}
              colorLight={colors.chemistryLight}
              path="/chemistry"
              gamesCount={3}
              progress={0}
            />
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
}
