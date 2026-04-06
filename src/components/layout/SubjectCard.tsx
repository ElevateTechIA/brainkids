'use client';

import { Card, CardContent, CardActionArea, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SubjectCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  colorLight: string;
  path: string;
  progress?: number;
  gamesCount?: number;
}

export default function SubjectCard({
  title,
  description,
  icon,
  color,
  colorLight,
  path,
  progress = 0,
  gamesCount = 0,
}: SubjectCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${colorLight}22, ${color}11)`,
          border: `2px solid ${color}33`,
          overflow: 'visible',
        }}
      >
        <CardActionArea onClick={() => router.push(`/${locale}/home${path}`)}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '16px',
                  background: `linear-gradient(135deg, ${color}, ${colorLight})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.8rem',
                  boxShadow: `0 4px 12px ${color}44`,
                }}
              >
                {icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ color, fontWeight: 700, lineHeight: 1.2 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3 }}>
                  {description}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: `${color}22`,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}, ${colorLight})`,
                  },
                }}
              />
              <Chip
                label={`${Math.round(progress)}%`}
                size="small"
                sx={{
                  bgcolor: `${color}22`,
                  color,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            </Box>

            {gamesCount > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                {gamesCount} {gamesCount === 1 ? 'juego' : 'juegos'}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
}
