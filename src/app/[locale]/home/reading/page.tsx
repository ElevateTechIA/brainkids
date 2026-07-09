'use client';

import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import GameCard from '@/components/layout/GameCard';
import { colors } from '@/lib/theme/colors';
import TrainRoundedIcon from '@mui/icons-material/TrainRounded';
import KitchenRoundedIcon from '@mui/icons-material/KitchenRounded';
import AdsClickRoundedIcon from '@mui/icons-material/AdsClickRounded';

const games = [
  {
    key: 'wordTrain',
    icon: <TrainRoundedIcon fontSize="large" />,
    path: '/home/reading/word-train',
    stars: 0,
    locked: false,
  },
  {
    key: 'letterKitchen',
    icon: <KitchenRoundedIcon fontSize="large" />,
    path: '/home/reading/letter-kitchen',
    stars: 0,
    locked: true,
  },
  {
    key: 'sightWordSplat',
    icon: <AdsClickRoundedIcon fontSize="large" />,
    path: '/home/reading/sight-word-splat',
    stars: 0,
    locked: true,
  },
];

export default function ReadingPage() {
  const t = useTranslations();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.reading}, ${colors.readingLight})`,
          color: 'white',
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4 },
          pb: { xs: 4, md: 5 },
          borderRadius: { xs: '0 0 28px 28px', md: '0 0 32px 32px' },
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              {t('subjects.reading.title')}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
              {t('subjects.reading.description')}
            </Typography>
          </motion.div>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          maxWidth: { xs: '100%', md: 1100 },
          mx: 'auto',
          width: '100%',
          px: { xs: 3, md: 5 },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          {t('home.chooseGame', { defaultValue: 'Elige un juego' })}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, md: 2.5 },
          }}
        >
          {games.map((game, idx) => (
            <motion.div
              key={game.key}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GameCard
                title={t(`games.${game.key}.title`, { defaultValue: game.key })}
                description={t(`games.${game.key}.description`, { defaultValue: '' })}
                icon={game.icon}
                color={colors.reading}
                path={game.path}
                stars={game.stars}
                locked={game.locked}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
