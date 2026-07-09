'use client';

import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import SelfImprovementRoundedIcon from '@mui/icons-material/SelfImprovementRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import { colors } from '@/lib/theme/colors';
import { useTheme } from '@/lib/theme/ThemeProvider';
import HamburgerMenu from './HamburgerMenu';

const navItems = [
  { key: 'home', icon: HomeRoundedIcon, path: 'home', color: colors.primary },
  { key: 'reading', icon: MenuBookRoundedIcon, path: 'home/reading', color: colors.reading },
  { key: 'math', icon: CalculateRoundedIcon, path: 'home/math', color: colors.math },
  { key: 'physics', icon: ScienceRoundedIcon, path: 'home/physics', color: colors.physics },
  { key: 'chemistry', icon: BiotechRoundedIcon, path: 'home/chemistry', color: colors.chemistry },
  { key: 'labyrinths', icon: ExploreRoundedIcon, path: 'home/labyrinths', color: colors.labyrinth },
];

const advancedItems = [
  { key: 'sadhana', icon: SelfImprovementRoundedIcon, path: 'home/sadhana', color: colors.sadhana },
  { key: 'philosophy', icon: PsychologyRoundedIcon, path: 'home/philosophy', color: colors.philosophy },
];

export const SIDEBAR_WIDTH = 256;

export default function Sidebar() {
  const t = useTranslations('nav');
  const tHome = useTranslations('home');
  const pathname = usePathname();
  const router = useRouter();
  const { palette, themeName } = useTheme();
  const isPlatinum = themeName === 'platinum';
  const locale = pathname.split('/')[1] || 'es';

  const isActive = (path: string, key: string) => {
    if (key === 'home') return /^\/[a-z]{2}\/home\/?$/.test(pathname);
    return pathname.includes(`/${path}`);
  };

  const renderItem = (item: (typeof navItems)[number]) => {
    const Icon = item.icon;
    const active = isActive(item.path, item.key);
    return (
      <ButtonBase
        key={item.key}
        onClick={() => router.push(`/${locale}/${item.path}`)}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          gap: 1.5,
          px: 2,
          py: 1.25,
          borderRadius: 2.5,
          bgcolor: active ? `${item.color}1a` : 'transparent',
          border: `1.5px solid ${active ? `${item.color}55` : 'transparent'}`,
          color: active ? item.color : palette.textSecondary,
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: active ? `${item.color}22` : palette.cardBgHover,
            transform: 'translateX(2px)',
          },
        }}
      >
        <Icon sx={{ fontSize: '1.4rem', color: active ? item.color : palette.textSecondary }} />
        <Typography
          sx={{
            fontWeight: active ? 800 : 600,
            fontSize: '0.95rem',
            color: active ? item.color : palette.textPrimary,
          }}
        >
          {t(item.key)}
        </Typography>
      </ButtonBase>
    );
  };

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        bgcolor: palette.cardBg,
        borderRight: `1px solid ${palette.cardBorder}`,
        py: 3,
        px: 2,
      }}
    >
      <Box
        onClick={() => router.push(`/${locale}/home`)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          mb: 3,
          cursor: 'pointer',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${palette.primary}, ${palette.primaryLight})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 900,
            fontSize: '1.1rem',
            boxShadow: `0 4px 12px ${palette.primary}55`,
          }}
        >
          B
        </Box>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.15rem',
            color: palette.textPrimary,
            fontFamily: isPlatinum
              ? 'var(--font-fraunces), serif'
              : 'var(--font-fredoka), sans-serif',
            letterSpacing: isPlatinum ? '-0.02em' : 'normal',
          }}
        >
          BrainKids
        </Typography>
      </Box>

      <Stack spacing={0.5} sx={{ flex: 1, overflowY: 'auto' }}>
        {navItems.map(renderItem)}

        <Typography
          variant="caption"
          sx={{
            px: 2,
            pt: 2.5,
            pb: 0.5,
            fontWeight: 700,
            color: palette.textMuted,
            letterSpacing: '0.08em',
            fontSize: '0.7rem',
          }}
        >
          {tHome('advanced')}
        </Typography>
        {advancedItems.map(renderItem)}
      </Stack>

      <Box sx={{ pt: 2, mt: 2, borderTop: `1px solid ${palette.cardBorder}` }}>
        <HamburgerMenu variant="sidebar" />
      </Box>
    </Box>
  );
}
