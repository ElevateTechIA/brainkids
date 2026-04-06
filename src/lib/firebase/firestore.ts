import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import type { PlayerState } from '@/lib/store/usePlayerStore';

const COLLECTION = 'users';

export async function getPlayerData(uid: string): Promise<Partial<PlayerState> | null> {
  const docRef = doc(db, COLLECTION, uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as Partial<PlayerState>;
  }
  return null;
}

export async function savePlayerData(uid: string, data: Partial<PlayerState>) {
  const docRef = doc(db, COLLECTION, uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await updateDoc(docRef, { ...data, updatedAt: Date.now() });
  } else {
    await setDoc(docRef, { ...data, createdAt: Date.now(), updatedAt: Date.now() });
  }
}
