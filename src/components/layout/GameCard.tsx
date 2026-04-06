'use client';

import { Card, CardContent, CardActionArea, Typography, Box, Rating } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

interface GameCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  path: string;
  stars?: number;
  locked?: boolean;
}

export default function GameCard({
  title,
  description,
  icon,
  color,
  path,
  stars = 0,
  locked = false,
}: GameCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  return (
    <motion.div
      whileHover={{ scale: locked ? 1 : 1.05 }}
      whileTap={{ scale: locked ? 1 : 0.95 }}
    >
      <Card
        sx={{
          opacity: locked ? 0.5 : 1,
          position: 'relative',
        }}
      >
        <CardActionArea
          disabled={locked}
          onClick={() => router.push(`/${locale}${path}`)}
        >
          <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '18px',
                background: `linear-gradient(135deg, ${color}, ${color}bb)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                mx: 'auto',
                mb: 1.5,
                boxShadow: `0 4px 16px ${color}44`,
              }}
            >
              {icon}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              {description}
            </Typography>
            <Rating
              value={stars}
              max={3}
              readOnly
              size="small"
              icon={<StarRoundedIcon sx={{ color: '#ffd93d' }} fontSize="inherit" />}
              emptyIcon={<StarRoundedIcon sx={{ color: '#e0e0e0' }} fontSize="inherit" />}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}
