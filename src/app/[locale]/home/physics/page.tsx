'use client';

import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import GameCard from '@/components/layout/GameCard';
import { colors } from '@/lib/theme/colors';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import BalanceRoundedIcon from '@mui/icons-material/BalanceRounded';
import ArchitectureRoundedIcon from '@mui/icons-material/ArchitectureRounded';

const games = [
  {
    key: 'rampLab',
    icon: <ScienceRoundedIcon fontSize="large" />,
    path: '/home/physics/ramp-lab',
    stars: 0,
    locked: false,
  },
  {
    key: 'catapult',
    icon: <RocketLaunchRoundedIcon fontSize="large" />,
    path: '/home/physics/catapult',
    stars: 0,
    locked: true,
  },
  {
    key: 'balanceLab',
    icon: <BalanceRoundedIcon fontSize="large" />,
    path: '/home/physics/balance-lab',
    stars: 0,
    locked: true,
  },
  {
    key: 'bridgeBuilder',
    icon: <ArchitectureRoundedIcon fontSize="large" />,
    path: '/home/physics/bridge-builder',
    stars: 0,
    locked: true,
  },
];

export default function PhysicsPage() {
  const t = useTranslations();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.physics}, ${colors.physicsLight})`,
          color: 'white',
          p: 3,
          pb: 4,
          borderRadius: '0 0 28px 28px',
        }}
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('subjects.physics.title')}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            {t('subjects.physics.description')}
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
                color={colors.physics}
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
