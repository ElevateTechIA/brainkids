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
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import LocalAtmRoundedIcon from '@mui/icons-material/LocalAtmRounded';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { logout } from '@/lib/firebase/auth';
import { colors } from '@/lib/theme/colors';
import { APP_VERSION, formatBuildDate } from '@/lib/version';
import ShareAppModal from '@/components/share/ShareAppModal';
import { useBalance } from '@/lib/hooks/useTokens';
import { getTokenTier, getTierColors } from '@/lib/tokens/tier';

const languages = [
  { code: 'es', flag: '🇪🇸', label: 'Espanol' },
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'pt', flag: '🇧🇷', label: 'Portugues' },
  { code: 'fr', flag: '🇫🇷', label: 'Francais' },
];

const avatars = ['🧒', '👧', '🦸', '🧑‍🚀', '🧑‍🔬', '🧙', '🦊', '🐱', '🐶', '🦁'];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const { displayName, avatarId, xp, level, streak } = usePlayerStore();
  const balance = useBalance();

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

  return (
    <>
      <Tooltip title={tier ? `${tier.toUpperCase()} tier` : ''} arrow>
        <ButtonBase
          onClick={() => setOpen(true)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: 1.5,
            py: 0.75,
            borderRadius: 999,
            bgcolor: 'rgba(255,255,255,0.2)',
            border: tierColors ? `1px solid ${tierColors.light}` : '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', transform: 'translateY(-1px)' },
          }}
        >
          <MonetizationOnRoundedIcon
            sx={{
              fontSize: '1.2rem',
              color: tierColors?.main ?? 'white',
              filter: tierColors ? `drop-shadow(0 1px 2px ${tierColors.main}66)` : undefined,
            }}
          />
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>
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
            width: 300,
            borderRadius: '20px 0 0 20px',
            bgcolor: colors.background,
          },
        }}
      >
        {/* Profile header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
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
              }}
            >
              {avatars[avatarId % avatars.length]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {displayName || 'Explorador'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {t('home.level', { level })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<StarRoundedIcon sx={{ color: '#ffd93d !important', fontSize: '1rem' }} />}
              label={`${xp} XP`}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}
            />
            {streak > 0 && (
              <Chip
                icon={<LocalFireDepartmentRoundedIcon sx={{ color: '#ff6b6b !important', fontSize: '1rem' }} />}
                label={`${streak}d`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: '0.75rem' }}
              />
            )}
          </Box>
        </Box>

        {/* Menu items */}
        <List sx={{ px: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleProfile} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonRoundedIcon sx={{ color: colors.primary }} />
              </ListItemIcon>
              <ListItemText
                primary={t('profile.title')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={handleTokens} sx={{ borderRadius: 2, mb: 0.5 }}>
              {(() => {
                const tierColor = balance !== null ? getTierColors(getTokenTier(balance)).main : colors.primary;
                return (
                  <>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <LocalAtmRoundedIcon sx={{ color: tierColor }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('tokens.title')}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    {balance !== null && (
                      <Chip
                        label={balance}
                        size="small"
                        sx={{ bgcolor: `${tierColor}22`, color: tierColor, fontWeight: 800, border: `1.5px solid ${tierColor}` }}
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
                <ShareRoundedIcon sx={{ color: colors.primary }} />
              </ListItemIcon>
              <ListItemText
                primary={t('share.menuItem')}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ mx: 2 }} />

        {/* Language section */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TranslateRoundedIcon sx={{ color: colors.primary, fontSize: '1.2rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {t('nav.home') === 'Accueil' ? 'Langue' : t('nav.home') === 'Inicio' && locale === 'pt' ? 'Idioma' : locale === 'fr' ? 'Langue' : locale === 'en' ? 'Language' : 'Idioma'}
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
                  bgcolor: locale === lang.code ? `${colors.primary}18` : 'transparent',
                  border: locale === lang.code ? `2px solid ${colors.primary}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: `${colors.primary}10` },
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{lang.flag}</Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: locale === lang.code ? 700 : 500,
                    color: locale === lang.code ? colors.primary : 'text.secondary',
                    fontSize: '0.8rem',
                  }}
                >
                  {lang.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mx: 2, mt: 2 }} />

        {/* Logout */}
        <List sx={{ px: 1, pt: 1 }}>
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutRoundedIcon sx={{ color: colors.error }} />
              </ListItemIcon>
              <ListItemText
                primary={t('auth.signOut')}
                primaryTypographyProps={{ fontWeight: 600, color: colors.error }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Version footer */}
        <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <InfoRoundedIcon sx={{ fontSize: '0.9rem', color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              BrainKids v{APP_VERSION}
            </Typography>
          </Box>
          {formatBuildDate(locale) && (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.25, fontSize: '0.7rem' }}>
              {formatBuildDate(locale)}
            </Typography>
          )}
        </Box>
      </Drawer>

      <ShareAppModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}
