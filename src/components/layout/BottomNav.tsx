'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded';
import { useTranslations } from 'next-intl';
import { colors } from '@/lib/theme/colors';

const navItems = [
  { key: 'home', icon: <HomeRoundedIcon />, path: 'home' },
  { key: 'reading', icon: <MenuBookRoundedIcon />, path: 'home/reading', color: colors.reading },
  { key: 'math', icon: <CalculateRoundedIcon />, path: 'home/math', color: colors.math },
  { key: 'physics', icon: <ScienceRoundedIcon />, path: 'home/physics', color: colors.physics },
  { key: 'chemistry', icon: <BiotechRoundedIcon />, path: 'home/chemistry', color: colors.chemistry },
];

export default function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const idx = navItems.findIndex((item) => {
      if (item.key === 'home') {
        return pathname.match(/^\/[a-z]{2}\/home$/);
      }
      return pathname.includes(item.path);
    });
    if (idx >= 0) setValue(idx);
  }, [pathname]);

  const locale = pathname.split('/')[1] || 'es';

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={value}
        onChange={(_, newValue) => {
          setValue(newValue);
          const item = navItems[newValue];
          router.push(`/${locale}/${item.path}`);
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.key}
            label={t(item.key)}
            icon={item.icon}
            sx={{
              '&.Mui-selected': {
                color: item.color || colors.primary,
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
