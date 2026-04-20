'use client';

import { useState } from 'react';
import { Box, Container, Typography, Card, CardContent, Stack, Avatar, LinearProgress, Button, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { colors } from '@/lib/theme/colors';
import { auth } from '@/lib/firebase/config';
import { sendPasswordReset } from '@/lib/firebase/auth';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';

export default function ProfilePage() {
  const t = useTranslations();
  const { displayName, xp, level, streak } = usePlayerStore();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; severity: 'success' | 'error'; message: string }>({
    open: false,
    severity: 'success',
    message: '',
  });

  const user = auth.currentUser;
  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === 'password') ?? false;
  const isGoogleOnly = !!user && !hasPasswordProvider && user.providerData.some((p) => p.providerId === 'google.com');

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await sendPasswordReset(user.email);
      setToast({ open: true, severity: 'success', message: t('profile.passwordResetSent') });
    } catch {
      setToast({ open: true, severity: 'error', message: t('profile.passwordResetError') });
    } finally {
      setSending(false);
    }
  };

  const xpForNextLevel = level * 100;
  const xpProgress = Math.min((xp / xpForNextLevel) * 100, 100);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: colors.background }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
          color: 'white',
          p: 3,
          pb: 5,
          borderRadius: '0 0 28px 28px',
          textAlign: 'center',
        }}
      >
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 1.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '2.5rem',
            }}
          >
            {displayName ? displayName[0].toUpperCase() : '🧒'}
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {displayName || t('profile.defaultName', { defaultValue: 'Explorador' })}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {t('home.level', { level })}
          </Typography>
        </motion.div>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -2, position: 'relative', zIndex: 1 }}>
        {/* XP Progress */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {t('profile.xpProgress', { defaultValue: 'Progreso de XP' })}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={xpProgress}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: `${colors.primary}22`,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {xp} / {xpForNextLevel} XP
            </Typography>
          </CardContent>
        </Card>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <EmojiEventsRoundedIcon sx={{ color: colors.accent, fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {level}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('profile.level', { defaultValue: 'Nivel' })}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <StarRoundedIcon sx={{ color: '#ffd93d', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {xp}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                XP
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <LocalFireDepartmentRoundedIcon sx={{ color: '#ff6b6b', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                {streak}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('profile.streak', { defaultValue: 'Racha' })}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Account / password */}
        {user && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t('profile.account')}
              </Typography>
              {isGoogleOnly ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('profile.googleAccountHint')}
                </Typography>
              ) : (
                <Button
                  onClick={handleChangePassword}
                  disabled={sending || !user.email}
                  startIcon={<LockResetRoundedIcon />}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: colors.primary,
                    color: colors.primary,
                    '&:hover': { borderColor: colors.primary, bgcolor: `${colors.primary}10` },
                  }}
                >
                  {t('profile.changePassword')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </Container>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((s) => ({ ...s, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
