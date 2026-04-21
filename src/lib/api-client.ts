import { auth } from '@/lib/firebase/config';

async function authedFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok && res.status !== 402) {
    const txt = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${txt}`);
  }
  return res;
}

export async function postRegister(deviceId: string, referrerUid: string | null) {
  const res = await authedFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ deviceId, referrerUid }),
  });
  return res.json();
}

export async function getBalance() {
  const res = await authedFetch('/api/credits/balance');
  return res.json() as Promise<{ balance: number; lifetimePurchased: number; lifetimeUsed: number }>;
}

export async function postCheckoutSession(packageId: string, locale: string) {
  const res = await authedFetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ packageId, locale }),
  });
  return res.json() as Promise<{ url: string }>;
}

export async function postUnlock(moduleId: 'sadhana' | 'philosophy') {
  const res = await authedFetch('/api/modules/unlock', {
    method: 'POST',
    body: JSON.stringify({ moduleId }),
  });
  return res.json();
}
