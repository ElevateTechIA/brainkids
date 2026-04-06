'use client';

import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import GameCard from '@/components/layout/GameCard';
import { colors } from '@/lib/theme/colors';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';

const games = [
  {
    key: 'elementMatch',
    icon: <GridViewRoundedIcon fontSize="large" />,
    path: '/home/chemistry/element-match',
    stars: 0,
    locked: false,
  },
  {
    key: 'moleculeBuilder',
    icon: <HubRoundedIcon fontSize="large" />,
    path: '/home/chemistry/molecule-builder',
    stars: 0,
    locked: false,
  },
  {
    key: 'reactionLab',
    icon: <ScienceRoundedIcon fontSize="large" />,
    path: '/home/chemistry/reaction-lab',
    stars: 0,
    locked: false,
  },
];

export default function ChemistryPage() {
  const t = useTranslations();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.chemistry}, ${colors.chemistryLight})`,
          color: 'white',
          p: 3,
          pb: 4,
          borderRadius: '0 0 28px 28px',
        }}
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('subjects.chemistry.title')}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            {t('subjects.chemistry.description')}
          </Typography>
        </motion.div>
      </Box>

      <Container maxWidth="sm" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          {t('home.chooseGame', { defaultValue: 'Elige un juego' })}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
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
                color={colors.chemistry}
                path={game.path}
                stars={game.stars}
                locked={game.locked}
              />
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
