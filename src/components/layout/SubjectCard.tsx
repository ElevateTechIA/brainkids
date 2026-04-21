'use client';

import { Card, CardContent, CardActionArea, Typography, Box, LinearProgress, Chip, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';

interface SubjectCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  colorLight: string;
  path: string;
  progress?: number;
  gamesCount?: number;
  comingSoon?: boolean;
  comingSoonLabel?: string;
  cost?: number;
  unlocked?: boolean;
  lockedLabel?: string;
  onLockedClick?: () => void;
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
  comingSoon = false,
  comingSoonLabel,
  cost,
  unlocked = true,
  lockedLabel,
  onLockedClick,
}: SubjectCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';

  const isLocked = !unlocked && !comingSoon;
  const interactive = !comingSoon;
  const dimmed = comingSoon || isLocked;

  return (
    <motion.div
      whileHover={interactive ? { scale: 1.03 } : undefined}
      whileTap={interactive ? { scale: 0.97 } : undefined}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${colorLight}22, ${color}11)`,
          border: `2px solid ${color}33`,
          overflow: 'visible',
          position: 'relative',
          opacity: dimmed ? 0.78 : 1,
        }}
      >
        {comingSoon && comingSoonLabel && (
          <Chip
            label={comingSoonLabel}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.7rem',
              zIndex: 2,
              boxShadow: `0 2px 6px ${color}66`,
            }}
          />
        )}
        {!comingSoon && cost !== undefined && (
          <Chip
            icon={
              unlocked ? (
                <LockOpenRoundedIcon sx={{ color: 'white !important', fontSize: '0.95rem' }} />
              ) : (
                <LockRoundedIcon sx={{ color: 'white !important', fontSize: '0.95rem' }} />
              )
            }
            label={unlocked ? '✓' : `${cost}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: color,
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              zIndex: 2,
              boxShadow: `0 2px 6px ${color}66`,
              '& .MuiChip-icon': { ml: 0.5 },
            }}
          />
        )}
        <CardActionArea
          disabled={comingSoon}
          onClick={() => {
            if (comingSoon) return;
            if (isLocked) {
              onLockedClick?.();
              return;
            }
            router.push(`/${locale}/home${path}`);
          }}
        >
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

            {!comingSoon && !isLocked && (
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
            )}

            {isLocked && lockedLabel && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                <LockRoundedIcon sx={{ color, fontSize: '1rem' }} />
                <Typography variant="caption" sx={{ color, fontWeight: 700 }}>
                  {lockedLabel}
                </Typography>
              </Stack>
            )}

            {!isLocked && !comingSoon && gamesCount > 0 && (
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
