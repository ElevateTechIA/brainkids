const STORAGE_KEY = 'bk_did';

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 50, 30);
    ctx.fillStyle = '#069';
    ctx.fillText('brainkids-fp', 2, 15);
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

export async function getDeviceId(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;

  const parts = [
    navigator.userAgent,
    `${screen.width}x${screen.height}`,
    `${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    canvasFingerprint(),
  ].join('|');

  const did = await sha256(parts);
  localStorage.setItem(STORAGE_KEY, did);
  return did;
}
