import { cert, getApps, initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function ensureApp(): App {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApps()[0]!;
    return _app;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local'
    );
  }

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return _app;
}

export const adminAuth = new Proxy({} as Auth, {
  get(_t, prop) {
    if (!_auth) _auth = getAuth(ensureApp());
    return Reflect.get(_auth, prop, _auth);
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_t, prop) {
    if (!_db) _db = getFirestore(ensureApp());
    return Reflect.get(_db, prop, _db);
  },
});

export async function verifyIdToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing Bearer token');
  }
  const token = authHeader.slice(7);
  if (!_auth) _auth = getAuth(ensureApp());
  return _auth.verifyIdToken(token);
}
