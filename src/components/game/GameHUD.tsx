'use client';

import { Box, Typography, IconButton, Chip } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface GameHUDProps {
  score: number;
  level?: number;
  color: string;
  title: string;
  showBack?: boolean;
}

export default function GameHUD({ score, level, color, title, showBack = true }: GameHUDProps) {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'white',
        borderRadius: '0 0 20px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {showBack && (
          <IconButton onClick={() => router.back()} size="small">
            <ArrowBackRoundedIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ color, fontWeight: 700 }}>
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {level !== undefined && (
          <Chip
            label={`Lv. ${level}`}
            size="small"
            sx={{ bgcolor: `${color}22`, color, fontWeight: 700 }}
          />
        )}
        <motion.div
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Chip
            icon={<StarRoundedIcon sx={{ color: '#ffd93d !important' }} />}
            label={score}
            sx={{ fontWeight: 700, fontSize: '1rem' }}
          />
        </motion.div>
      </Box>
    </Box>
  );
}
