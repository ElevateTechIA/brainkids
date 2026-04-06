'use client';

import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import GameCard from '@/components/layout/GameCard';
import { colors } from '@/lib/theme/colors';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import GridOnRoundedIcon from '@mui/icons-material/GridOnRounded';

const games = [
  {
    key: 'numberMonster',
    icon: <PsychologyRoundedIcon fontSize="large" />,
    path: '/home/math/number-monster',
    stars: 0,
    locked: false,
  },
  {
    key: 'mathTower',
    icon: <AccountBalanceRoundedIcon fontSize="large" />,
    path: '/home/math/math-tower',
    stars: 0,
    locked: true,
  },
  {
    key: 'timesTable',
    icon: <GridOnRoundedIcon fontSize="large" />,
    path: '/home/math/times-table',
    stars: 0,
    locked: true,
  },
];

export default function MathPage() {
  const t = useTranslations();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.math}, ${colors.mathLight})`,
          color: 'white',
          p: 3,
          pb: 4,
          borderRadius: '0 0 28px 28px',
        }}
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('subjects.math.title')}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            {t('subjects.math.description')}
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
                color={colors.math}
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
