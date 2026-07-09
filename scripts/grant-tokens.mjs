// One-shot admin script to grant tokens to a user by email.
// Usage:
//   node scripts/grant-tokens.mjs <email> <amount>
//
// Reads Firebase Admin creds from .env.local (FIREBASE_PROJECT_ID,
// FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = join(__dirname, '..', '.env.local');
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip optional surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const [, , email, amountArg] = process.argv;
if (!email || !amountArg) {
  console.error('Usage: node scripts/grant-tokens.mjs <email> <amount>');
  process.exit(1);
}
const amount = Number(amountArg);
if (!Number.isFinite(amount) || amount <= 0) {
  console.error('Amount must be a positive number');
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const auth = getAuth();
const db = getFirestore();

const user = await auth.getUserByEmail(email);
console.log(`Found user: ${user.uid}  (${user.email})`);

const ref = db.doc(`user-credits/${user.uid}`);
const before = (await ref.get()).data();
console.log('Before:', {
  balance: before?.balance ?? 0,
  lifetimePurchased: before?.lifetimePurchased ?? 0,
  lifetimeUsed: before?.lifetimeUsed ?? 0,
});

await db.runTransaction(async (tx) => {
  const snap = await tx.get(ref);
  if (snap.exists) {
    tx.update(ref, {
      balance: FieldValue.increment(amount),
      lifetimePurchased: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    tx.set(ref, {
      uid: user.uid,
      balance: amount,
      lifetimePurchased: amount,
      lifetimeUsed: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  // Audit trail
  const grantRef = db.collection('credit-grants').doc();
  tx.set(grantRef, {
    uid: user.uid,
    email: user.email,
    amount,
    reason: 'admin-grant',
    createdAt: FieldValue.serverTimestamp(),
  });
});

const after = (await ref.get()).data();
console.log('After: ', {
  balance: after?.balance ?? 0,
  lifetimePurchased: after?.lifetimePurchased ?? 0,
  lifetimeUsed: after?.lifetimeUsed ?? 0,
});
console.log(`✅ Granted ${amount} tokens to ${email}`);
process.exit(0);
