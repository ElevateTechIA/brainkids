'use client';

import { Box, Typography, Button, Container, Stack, TextField, Divider, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslations } from 'next-intl';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, onAuthChange } from '@/lib/firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { colors } from '@/lib/theme/colors';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const setUid = usePlayerStore((s) => s.setUid);
  const setProfile = usePlayerStore((s) => s.setProfile);
  const [loading, setLoading] = useState(true);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) {
        setUid(user.uid);
        if (user.displayName) {
          setProfile(user.displayName, 0);
        }
        router.push(`/${locale}/home`);
      }
      setLoading(false);
    });
    return unsub;
  }, [locale, router, setUid, setProfile]);

  const handleGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      setUid(user.uid);
      if (user.displayName) setProfile(user.displayName, 0);
      router.push(`/${locale}/home`);
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': return t('errorInvalidEmail');
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return t('errorWrongPassword');
      case 'auth/email-already-in-use': return t('errorEmailInUse');
      case 'auth/weak-password': return t('errorWeakPassword');
      default: return t('errorGeneric');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let user;
      if (isSignUp) {
        user = await signUpWithEmail(email, password, name || 'Explorador');
        setProfile(name || 'Explorador', 0);
      } else {
        user = await signInWithEmail(email, password);
      }
      setUid(user.uid);
      if (user.displayName) setProfile(user.displayName, 0);
      router.push(`/${locale}/home`);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      setError(getErrorMessage(firebaseErr.code || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: colors.background }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Typography variant="h2">🧠</Typography>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(160deg, ${colors.primaryLight}33, ${colors.background}, ${colors.accent}22)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Typography variant="h1" sx={{ fontSize: '3.5rem', mb: 0.5 }}>
                🧠
              </Typography>
            </motion.div>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
              }}
            >
              BrainKids
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t('subtitle')}
            </Typography>
          </Box>

          {/* Email/Password form */}
          <Box
            component="form"
            onSubmit={handleEmailSubmit}
            sx={{
              maxWidth: 380,
              mx: 'auto',
              bgcolor: 'white',
              borderRadius: 4,
              p: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}>
              {isSignUp ? t('signUp') : t('signIn')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Stack spacing={2}>
              {isSignUp && (
                <TextField
                  label={t('name')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  size="medium"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              )}
              <TextField
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="medium"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                size="medium"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  py: 1.5,
                }}
              >
                {submitting ? '...' : isSignUp ? t('signUp') : t('signIn')}
              </Button>
            </Stack>

            <Typography
              variant="body2"
              sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}
            >
              {isSignUp ? t('hasAccount') : t('noAccount')}{' '}
              <Typography
                component="span"
                variant="body2"
                sx={{ color: colors.primary, fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              >
                {isSignUp ? t('signIn') : t('signUp')}
              </Typography>
            </Typography>

            {/* Divider */}
            <Divider sx={{ my: 2.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('orContinueWith')}
              </Typography>
            </Divider>

            {/* Google button */}
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogle}
              sx={{
                borderColor: '#ddd',
                color: 'text.primary',
                '&:hover': { bgcolor: '#fafafa', borderColor: '#ccc' },
              }}
            >
              Google
            </Button>
          </Box>

          {/* Language selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 3 }}>
            {[
              { code: 'es', flag: '🇪🇸', label: 'ES' },
              { code: 'en', flag: '🇺🇸', label: 'EN' },
              { code: 'pt', flag: '🇧🇷', label: 'PT' },
              { code: 'fr', flag: '🇫🇷', label: 'FR' },
            ].map((lang) => (
              <Box
                key={lang.code}
                onClick={() => router.push(`/${lang.code}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: '10px',
                  bgcolor: locale === lang.code ? `${colors.primary}22` : 'transparent',
                  border: locale === lang.code ? `2px solid ${colors.primary}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: `${colors.primary}11` },
                }}
              >
                <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{lang.flag}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: locale === lang.code ? colors.primary : 'text.secondary' }}>
                  {lang.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
