'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { colors } from '@/lib/theme/colors';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ShareAppModal({ open, onClose }: Props) {
  const t = useTranslations('share');
  const [shareUrl, setShareUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      const base = window.location.origin;
      const url = user ? `${base}/?ref=${user.uid}` : base;
      setShareUrl(url);
      try {
        const data = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          color: { dark: colors.primaryDark, light: '#ffffff' },
        });
        setQrDataUrl(data);
      } catch (err) {
        console.error('QR gen failed', err);
      }
    });
    return unsub;
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNativeShare = async () => {
    const text = `${t('inviteText')} ${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'BrainKids', text, url: shareUrl });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'brainkids-qr.png';
    a.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ position: 'relative', p: 3 }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <Stack spacing={2.5} alignItems="center" sx={{ mt: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.primary, textAlign: 'center' }}>
            {t('title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', px: 2 }}>
            {t('subtitle')}
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              bgcolor: 'white',
              boxShadow: `0 4px 16px ${colors.primary}22`,
              border: `2px solid ${colors.primary}22`,
            }}
          >
            {qrDataUrl ? (
              <Box
                component="img"
                src={qrDataUrl}
                alt="QR code"
                sx={{ width: 220, height: 220, display: 'block' }}
              />
            ) : (
              <Box sx={{ width: 220, height: 220, bgcolor: '#f0f0f0', borderRadius: 2 }} />
            )}
          </Box>

          <TextField
            value={shareUrl}
            fullWidth
            size="small"
            InputProps={{ readOnly: true, sx: { borderRadius: 3, fontSize: '0.85rem' } }}
            onClick={(e) => (e.target as HTMLInputElement).select?.()}
          />

          <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ContentCopyRoundedIcon />}
              onClick={handleCopy}
              sx={{ borderRadius: 3, borderColor: colors.primary, color: colors.primary }}
            >
              {copied ? t('copied') : t('copy')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<IosShareRoundedIcon />}
              onClick={handleNativeShare}
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              }}
            >
              {t('share')}
            </Button>
          </Stack>

          <Button
            size="small"
            startIcon={<DownloadRoundedIcon />}
            onClick={handleDownloadQr}
            sx={{ color: 'text.secondary' }}
          >
            {t('downloadQr')}
          </Button>

          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', px: 1 }}>
            {t('reward')}
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
