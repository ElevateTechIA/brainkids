'use client';

import { useState } from 'react';
import {
  ButtonBase,
  Drawer,
  Box,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
} from '@mui/material';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LocalAtmRoundedIcon from '@mui/icons-material/LocalAtmRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { logout } from '@/lib/firebase/auth';
import { APP_VERSION, formatBuildDate } from '@/lib/version';
import ShareAppModal from '@/components/share/ShareAppModal';
import { useBalance } from '@/lib/hooks/useTokens';
import { getTokenTier, getTierColors } from '@/lib/tokens/tier';
import { useTheme } from '@/lib/theme/ThemeProvider';
import type { ThemeName } from '@/lib/theme/colors';

const languages = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Português' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
];

const avatars = ['🧒', '👧', '🦸', '🧑‍🚀', '🧑‍🔬', '🧙', '🦊', '🐱', '🐶', '🦁'];

interface HamburgerMenuProps {
  variant?: 'header' | 'sidebar';
}

export default function HamburgerMenu({ variant = 'header' }: HamburgerMenuProps = {}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const { displayName, avatarId, xp, level, streak } = usePlayerStore();
  const balance = useBalance();
  const { palette, themeName, mode, setTheme, toggleMode } = useTheme();
  const isPlatinum = themeName === 'platinum';

  const handleLanguageChange = (code: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '');
    router.push(`/${code}${pathWithoutLocale}`);
    setOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
    setOpen(false);
  };

  const handleProfile = () => {
    router.push(`/${locale}/home/profile`);
    setOpen(false);
  };

  const handleTokens = () => {
    router.push(`/${locale}/parent/tokens`);
    setOpen(false);
  };

  const handleShare = () => {
    setOpen(false);
    setShareOpen(true);
  };

  const tier = balance !== null ? getTokenTier(balance) : null;
  const tierColors = tier ? getTierColors(tier) : null;

  const isSidebar = variant === 'sidebar';

  return (
    <>
      <Tooltip title={tier ? `${tier.toUpperCase()} tier` : t('home.menu', { defaultValue: 'Menú' })} arrow>
        <ButtonBase
          onClick={() => setOpen(true)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: 999,
            bgcolor: isSidebar
              ? palette.cardBg
              : isPlatinum
                ? 'rgba(0,0,0,0.4)'
                : 'rgba(255,255,255,0.2)',
            border: tierColors
              ? `1px solid ${tierColors.light}`
              : `1px solid ${palette.cardBorder}`,
            backdropFilter: isSidebar ? undefined : 'blur(8px)',
            boxShadow: isSidebar ? `0 2px 8px ${palette.primary}11` : undefined,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: isSidebar
                ? palette.cardBgHover
                : isPlatinum
                  ? 'rgba(0,0,0,0.55)'
                  : 'rgba(255,255,255,0.3)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {isSidebar && (
            <MenuRoundedIcon sx={{ fontSize: '1.2rem', color: palette.textSecondary }} />
          )}
          <MonetizationOnRoundedIcon
            sx={{
              fontSize: '1.2rem',
              color: tierColors?.main ?? palette.primary,
              filter: tierColors ? `drop-shadow(0 1px 2px ${tierColors.main}66)` : undefined,
            }}
          />
          <Typography
            sx={{
              color: isSidebar ? palette.textPrimary : '#fff',
              fontWeight: 800,
              fontSize: '0.9rem',
              lineHeight: 1,
            }}
          >
            {balance ?? 0}
          </Typography>
        </ButtonBase>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            borderRadius: '20px 0 0 20px',
            bgcolor: palette.background,
            backgroundImage: 'none',
          },
        }}
      >
        {/* Profile header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${palette.gradientFrom}, ${palette.gradientVia}, ${palette.gradientTo})`,
            color: 'white',
            p: 3,
            pb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                fontSize: '2rem',
                bgcolor: 'rgba(255,255,255,0.2)',
                border: `1.5px solid ${palette.metallicLight}`,
              }}
            >
              {avatars[avatarId % avatars.length]}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontFamily: isPlatinum
                    ? 'var(--font-fraunces), serif'
                    : 'var(--font-fredoka), sans-serif',
                }}
              >
                {displayName || 'Explorador'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {t('home.level', { level })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<StarRoundedIcon sx={{ color: '#ffd93d !important', fontSize: '1rem' }} />}
              label={`${xp} XP`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
            {streak > 0 && (
              <Chip
                icon={
                  <LocalFireDepartmentRoundedIcon
                    sx={{ color: '#ff6b6b !important', fontSize: '1rem' }}
                  />
                }
                label={`${streak}d`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Theme switcher */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <PaletteRoundedIcon sx={{ color: palette.primary, fontSize: '1.2rem' }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: palette.textSecondary, letterSpacing: '0.05em' }}
            >
              THEME
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            {(['candy', 'platinum'] as ThemeName[]).map((name) => {
              const active = themeName === name;
              return (
                <ButtonBase
                  key={name}
                  onClick={() => setTheme(name)}
                  sx={{
                    flex: 1,
                    py: 1.25,
                    borderRadius: 2,
                    border: `1.5px solid ${active ? palette.primary : palette.cardBorder}`,
                    bgcolor: active ? palette.primaryBg : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: palette.primaryBg },
                  }}
                >
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: active ? palette.primary : palette.textPrimary,
                        textTransform: 'capitalize',
                        fontFamily:
                          name === 'platinum'
                            ? 'var(--font-fraunces), serif'
                            : 'var(--font-fredoka), sans-serif',
                        letterSpacing: name === 'platinum' ? '-0.01em' : 'normal',
                      }}
                    >
                      {name === 'candy' ? '🍬 Candy' : '◆ Platinum'}
                    </Typography>
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

          <ButtonBase
            onClick={toggleMode}
            sx={{
              width: '100%',
              py: 1,
              borderRadius: 2,
              border: `1px solid ${palette.cardBorder}`,
              bgcolor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'all 0.2s',
              '&:hover': { bgcolor: palette.cardBgHover },
            }}
          >
            {mode === 'dark' ? (
              <DarkModeRoundedIcon sx={{ fontSize: '1.05rem', color: palette.textSecondary }} />
            ) : (
              <LightModeRoundedIcon sx={{ fontSize: '1.05rem', color: palette.textSecondary }} />
            )}
            <Typography
              sx={{ fontSize: '0.85rem', fontWeight: 600, color: palette.textSecondary }}
            >
              {mode === 'dark' ? 'Dark mode' : 'Light mode'}
            </Typography>
          </ButtonBase>
        </Box>

        <Divider sx={{ mx: 2, mt: 2, borderColor: palette.cardBorder }} />

        {/* Menu items */}
        <List sx={{ px: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleProfile} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonRoundedIcon sx={{ color: palette.primary }} />
              </ListItemIcon>
              <ListItemText
                primary={t('profile.title')}
                primaryTypographyProps={{ fontWeight: 600, color: palette.textPrimary }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleTokens} sx={{ borderRadius: 2, mb: 0.5 }}>
              {(() => {
                const tierColor = tierColors?.main ?? palette.primary;
                return (
                  <>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocalAtmRoundedIcon sx={{ color: tierColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('tokens.title')}
                      primaryTypographyProps={{ fontWeight: 600, color: palette.textPrimary }}
                    />
                    {balance !== null && (
                      <Chip
                        label={balance}
                        size="small"
                        sx={{
                          bgcolor: `${tierColor}22`,
                          color: tierColor,
                          fontWeight: 800,
                          border: `1.5px solid ${tierColor}`,
                        }}
                      />
                    )}
                  </>
                );
              })()}
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleShare} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ShareRoundedIcon sx={{ color: palette.primary }} />
              </ListItemIcon>
              <ListItemText
                primary={t('share.menuItem')}
                primaryTypographyProps={{ fontWeight: 600, color: palette.textPrimary }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ mx: 2, borderColor: palette.cardBorder }} />

        {/* Language section */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TranslateRoundedIcon sx={{ color: palette.primary, fontSize: '1.2rem' }} />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, color: palette.textSecondary, letterSpacing: '0.05em' }}
            >
              {locale === 'fr' ? 'LANGUE' : locale === 'en' ? 'LANGUAGE' : 'IDIOMA'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {languages.map((lang) => (
              <Box
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.5,
                  py: 0.8,
                  borderRadius: '12px',
                  bgcolor: locale === lang.code ? palette.primaryBg : 'transparent',
                  border:
                    locale === lang.code
                      ? `2px solid ${palette.primary}`
                      : `2px solid transparent`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: palette.primaryBg },
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{lang.flag}</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: locale === lang.code ? 700 : 500,
                    color:
                      locale === lang.code ? palette.primary : palette.textSecondary,
                    fontSize: '0.8rem',
                  }}
                >
                  {lang.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mx: 2, mt: 2, borderColor: palette.cardBorder }} />

        {/* Logout */}
        <List sx={{ px: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutRoundedIcon sx={{ color: palette.error }} />
              </ListItemIcon>
              <ListItemText
                primary={t('auth.signOut')}
                primaryTypographyProps={{ fontWeight: 600, color: palette.error }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Version footer */}
        <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <InfoRoundedIcon sx={{ fontSize: '0.9rem', color: palette.textMuted }} />
            <Typography variant="caption" sx={{ color: palette.textMuted }}>
              BrainKids v{APP_VERSION}
            </Typography>
          </Box>
          {formatBuildDate(locale) && (
            <Typography
              variant="caption"
              sx={{
                color: palette.textMuted,
                display: 'block',
                mt: 0.25,
                fontSize: '0.7rem',
              }}
            >
              {formatBuildDate(locale)}
            </Typography>
          )}
        </Box>
      </Drawer>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
