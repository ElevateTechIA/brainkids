const KEY = 'bk_ref';
const KEY_AT = 'bk_ref_at';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function captureReferralFromUrl(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (!ref) return;
  if (!/^[a-zA-Z0-9_-]{6,64}$/.test(ref)) return;
  localStorage.setItem(KEY, ref);
  localStorage.setItem(KEY_AT, String(Date.now()));
}

export function getStoredReferral(): string | null {
  if (typeof window === 'undefined') return null;
  const ref = localStorage.getItem(KEY);
  const at = Number(localStorage.getItem(KEY_AT) || 0);
  if (!ref || !at) return null;
  if (Date.now() - at > TTL_MS) {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_AT);
    return null;
  }
  return ref;
}

export function clearStoredReferral(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(KEY_AT);
}
