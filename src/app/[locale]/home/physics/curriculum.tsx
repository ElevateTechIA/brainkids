'use client';

import { ReactNode } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import GameCard from '@/components/layout/GameCard';
import { colors } from '@/lib/theme/colors';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DirectionsRunRoundedIcon from '@mui/icons-material/DirectionsRunRounded';
import FitnessCenterRoundedIcon from '@mui/icons-material/FitnessCenterRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import Rotate90DegreesCcwRoundedIcon from '@mui/icons-material/Rotate90DegreesCcwRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import ArchitectureRoundedIcon from '@mui/icons-material/ArchitectureRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';

export interface CategoryDef {
  id: string;
  icon: ReactNode;
}

export interface LessonDef {
  key: string; // games.<key> translation namespace
  icon: ReactNode;
  path: string; // '' when not built yet (locked placeholder)
  locked: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'cinematica', icon: <DirectionsRunRoundedIcon fontSize="large" /> },
  { id: 'dinamica', icon: <FitnessCenterRoundedIcon fontSize="large" /> },
  { id: 'energia', icon: <BoltRoundedIcon fontSize="large" /> },
  { id: 'rotacion', icon: <Rotate90DegreesCcwRoundedIcon fontSize="large" /> },
];

export const LESSONS: Record<string, LessonDef[]> = {
  cinematica: [
    { key: 'velocidadLineal', icon: <SpeedRoundedIcon fontSize="large" />, path: '/home/physics/velocidad-lineal', locked: false },
    { key: 'aceleracion', icon: <TrendingUpRoundedIcon fontSize="large" />, path: '', locked: true },
    { key: 'mru', icon: <StraightenRoundedIcon fontSize="large" />, path: '', locked: true },
    { key: 'caidaLibre', icon: <PublicRoundedIcon fontSize="large" />, path: '', locked: true },
  ],
  dinamica: [
    { key: 'rampLab', icon: <ScienceRoundedIcon fontSize="large" />, path: '/home/physics/ramp-lab', locked: false },
    { key: 'bridgeBuilder', icon: <ArchitectureRoundedIcon fontSize="large" />, path: '/home/physics/bridge-builder', locked: false },
    { key: 'newton', icon: <FitnessCenterRoundedIcon fontSize="large" />, path: '', locked: true },
  ],
  energia: [
    { key: 'catapult', icon: <RocketLaunchRoundedIcon fontSize="large" />, path: '/home/physics/catapult', locked: true },
  ],
  rotacion: [
    { key: 'balanceLab', icon: <BalanceRoundedIcon fontSize="large" />, path: '/home/physics/balance-lab', locked: true },
  ],
};

function Header({ title, description, onBack }: { title: string; description: string; onBack?: () => void }) {
  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${colors.physics}, ${colors.physicsLight})`,
        color: 'white',
        px: { xs: 3, md: 5 },
        py: { xs: 3, md: 4 },
        pb: { xs: 4, md: 5 },
        borderRadius: { xs: '0 0 28px 28px', md: '0 0 32px 32px' },
      }}
    >
      <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onBack && (
              <IconButton onClick={onBack} sx={{ color: 'white', ml: -1 }} aria-label="back">
                <ArrowBackRoundedIcon />
              </IconButton>
            )}
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              {title}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            {description}
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        mt: 3,
        maxWidth: { xs: '100%', md: 1100 },
        mx: 'auto',
        width: '100%',
        px: { xs: 3, md: 5 },
        pb: 6,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
          gap: { xs: 2, md: 2.5 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// Physics landing: choose a category
export function PhysicsCategories() {
  const t = useTranslations();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <Header title={t('subjects.physics.title')} description={t('subjects.physics.description')} />
      <CardGrid>
        {CATEGORIES.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <GameCard
              title={t(`physicsCategories.${cat.id}.title`)}
              description={t(`physicsCategories.${cat.id}.description`)}
              icon={cat.icon}
              color={colors.physics}
              path={`/home/physics/${cat.id}`}
            />
          </motion.div>
        ))}
      </CardGrid>
    </Box>
  );
}

// Category detail: list its lessons
export function CategoryLessons({ catId }: { catId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const lessons = LESSONS[catId] || [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      <Header
        title={t(`physicsCategories.${catId}.title`)}
        description={t(`physicsCategories.${catId}.description`)}
        onBack={() => router.push(`/${locale}/home/physics`)}
      />
      <CardGrid>
        {lessons.map((lesson, idx) => (
          <motion.div
            key={lesson.key}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.08 }}
          >
            <GameCard
              title={t(`games.${lesson.key}.title`, { defaultValue: lesson.key })}
              description={t(`games.${lesson.key}.description`, { defaultValue: '' })}
              icon={lesson.icon}
              color={colors.physics}
              path={lesson.path || '/home/physics'}
              locked={lesson.locked}
            />
          </motion.div>
        ))}
      </CardGrid>
    </Box>
  );
}
