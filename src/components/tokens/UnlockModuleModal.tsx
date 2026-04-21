'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  TextField,
  Alert,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { colors } from '@/lib/theme/colors';
import { MODULE_COSTS, ModuleId } from '@/lib/tokens/config';
import { postUnlock } from '@/lib/api-client';
import { useBalance } from '@/lib/hooks/useTokens';

interface Props {
  open: boolean;
  moduleId: ModuleId | null;
  moduleTitle: string;
  moduleColor: string;
  onClose: () => void;
  onUnlocked?: () => void;
}

type Stage = 'gate' | 'confirm' | 'result';

function makeChallenge() {
  const a = 7 + Math.floor(Math.random() * 12);
  const b = 6 + Math.floor(Math.random() * 9);
  return { a, b, answer: a + b };
}

export default function UnlockModuleModal({
  open,
  moduleId,
  moduleTitle,
  moduleColor,
  onClose,
  onUnlocked,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'es';
  const balance = useBalance();
  const [stage, setStage] = useState<Stage>('gate');
  const [challenge, setChallenge] = useState(makeChallenge());
  const [input, setInput] = useState('');
  const [gateError, setGateError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [resultKind, setResultKind] = useState<'success' | 'insufficient' | 'error'>('success');

  const cost = moduleId ? MODULE_COSTS[moduleId] : 0;
  const canAfford = useMemo(() => (balance ?? 0) >= cost, [balance, cost]);

  useEffect(() => {
    if (open) {
      setStage('gate');
      setChallenge(makeChallenge());
      setInput('');
      setGateError(false);
      setResultMsg('');
    }
  }, [open, moduleId]);

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(input, 10) === challenge.answer) {
      setGateError(false);
      setStage('confirm');
    } else {
      setGateError(true);
      setChallenge(makeChallenge());
      setInput('');
    }
  };

  const handleConfirm = async () => {
    if (!moduleId) return;
    setSubmitting(true);
    try {
      const res = await postUnlock(moduleId);
      if (res.alreadyUnlocked || res.unlocked) {
        setResultKind('success');
        setResultMsg(t('unlock.successBody'));
        setStage('result');
        onUnlocked?.();
      } else if (res.insufficient) {
        setResultKind('insufficient');
        setResultMsg(t('unlock.insufficientBody', { needed: res.needed, balance: res.balance }));
        setStage('result');
      } else {
        setResultKind('error');
        setResultMsg(t('unlock.errorBody'));
        setStage('result');
      }
    } catch (err) {
      console.error(err);
      setResultKind('error');
      setResultMsg(t('unlock.errorBody'));
      setStage('result');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ position: 'relative', p: 3 }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseRoundedIcon />
        </IconButton>

        {stage === 'gate' && (
          <Stack spacing={2.5} alignItems="center" sx={{ mt: 1 }}>
            <LockRoundedIcon sx={{ fontSize: 56, color: moduleColor }} />
            <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', color: moduleColor }}>
              {t('unlock.gateTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {t('unlock.gateSubtitle', { module: moduleTitle })}
            </Typography>

            <Box
              component="form"
              onSubmit={handleGateSubmit}
              sx={{
                width: '100%',
                bgcolor: `${moduleColor}11`,
                borderRadius: 3,
                p: 2.5,
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                {challenge.a} + {challenge.b} = ?
              </Typography>
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                autoFocus
                inputProps={{ inputMode: 'numeric', style: { textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 } }}
                sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              {gateError && (
                <Typography variant="caption" sx={{ color: colors.error, display: 'block', mt: 1 }}>
                  {t('unlock.gateWrong')}
                </Typography>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ mt: 2, borderRadius: 3, bgcolor: moduleColor, '&:hover': { bgcolor: moduleColor } }}
              >
                {t('unlock.gateContinue')}
              </Button>
            </Box>
          </Stack>
        )}

        {stage === 'confirm' && (
          <Stack spacing={2.5} alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center', color: moduleColor }}>
              {t('unlock.confirmTitle', { module: moduleTitle })}
            </Typography>

            <Box
              sx={{
                width: '100%',
                bgcolor: `${moduleColor}11`,
                borderRadius: 3,
                p: 2.5,
              }}
            >
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('unlock.cost')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {cost} {t('tokens.tokens')}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('unlock.yourBalance')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {balance ?? 0} {t('tokens.tokens')}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ pt: 1, borderTop: `1px solid ${moduleColor}33` }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('unlock.afterUnlock')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: canAfford ? moduleColor : colors.error }}>
                  {(balance ?? 0) - cost} {t('tokens.tokens')}
                </Typography>
              </Stack>
            </Box>

            {!canAfford && (
              <Alert severity="warning" sx={{ width: '100%', borderRadius: 2 }}>
                {t('unlock.notEnough')}
              </Alert>
            )}

            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={onClose}
                sx={{ borderRadius: 3 }}
              >
                {t('unlock.cancel')}
              </Button>
              {canAfford ? (
                <Button
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  onClick={handleConfirm}
                  sx={{ borderRadius: 3, bgcolor: moduleColor, '&:hover': { bgcolor: moduleColor } }}
                >
                  {submitting ? '...' : t('unlock.unlock')}
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => router.push(`/${locale}/parent/tokens`)}
                  sx={{
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  }}
                >
                  {t('unlock.buyTokens')}
                </Button>
              )}
            </Stack>
          </Stack>
        )}

        {stage === 'result' && (
          <Stack spacing={2.5} alignItems="center" sx={{ mt: 1 }}>
            {resultKind === 'success' ? (
              <LockOpenRoundedIcon sx={{ fontSize: 64, color: colors.success }} />
            ) : (
              <LockRoundedIcon sx={{ fontSize: 64, color: colors.error }} />
            )}
            <Typography variant="h6" sx={{ fontWeight: 800, textAlign: 'center' }}>
              {resultKind === 'success' ? t('unlock.successTitle') : t('unlock.errorTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {resultMsg}
            </Typography>
            {resultKind === 'insufficient' ? (
              <Button
                fullWidth
                variant="contained"
                onClick={() => router.push(`/${locale}/parent/tokens`)}
                sx={{
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                }}
              >
                {t('unlock.buyTokens')}
              </Button>
            ) : (
              <Button fullWidth variant="contained" onClick={onClose} sx={{ borderRadius: 3, bgcolor: moduleColor, '&:hover': { bgcolor: moduleColor } }}>
                {t('unlock.close')}
              </Button>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
