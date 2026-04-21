'use client';

import { Box, Typography, ButtonBase, Tooltip } from '@mui/material';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import { useRouter, usePathname } from 'next/navigation';
import { useBalance } from '@/lib/hooks/useTokens';
import { getTokenTier, getTierColors } from '@/lib/tokens/tier';

interface Props {
  variant?: 'header' | 'pill';
  onClick?: () => void;
}

export default function TokenBadge({ variant = 'pill', onClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const balance = useBalance();

  if (balance === null) return null;

  const tier = getTokenTier(balance);
  const { main, light } = getTierColors(tier);

  const handleClick = () => {
    if (onClick) return onClick();
    router.push(`/${locale}/parent/tokens`);
  };

  if (variant === 'header') {
    return (
      <Tooltip title={`${tier.toUpperCase()} tier`} arrow>
        <ButtonBase
          onClick={handleClick}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            bgcolor: 'rgba(255,255,255,0.2)',
            border: `1px solid ${light}`,
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.28)', transform: 'translateY(-1px)' },
          }}
        >
          <MonetizationOnRoundedIcon
            sx={{
              fontSize: '1.1rem',
              color: main,
              filter: `drop-shadow(0 1px 2px ${main}66)`,
            }}
          />
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.85rem' }}>
            {balance}
          </Typography>
        </ButtonBase>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`${tier.toUpperCase()} tier`} arrow>
      <ButtonBase
        onClick={handleClick}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.2,
          py: 0.4,
          borderRadius: 999,
          bgcolor: `${main}18`,
          border: `1.5px solid ${main}`,
          transition: 'all 0.2s',
          '&:hover': { bgcolor: `${main}28` },
        }}
      >
        <MonetizationOnRoundedIcon sx={{ fontSize: '1rem', color: main }} />
        <Typography sx={{ color: main, fontWeight: 800, fontSize: '0.8rem' }}>
          {balance}
        </Typography>
      </ButtonBase>
    </Tooltip>
  );
}
