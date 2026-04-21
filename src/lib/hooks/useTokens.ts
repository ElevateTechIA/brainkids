'use client';

import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import type { ModuleId } from '@/lib/tokens/config';

export function useBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let unsubBalance: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubBalance?.();
      if (!user) {
        setBalance(null);
        return;
      }
      unsubBalance = onSnapshot(doc(db, 'user-credits', user.uid), (snap) => {
        setBalance(snap.data()?.balance ?? 0);
      });
    });
    return () => {
      unsubBalance?.();
      unsubAuth();
    };
  }, []);

  return balance;
}

export function useUnlocks() {
  const [unlocks, setUnlocks] = useState<Set<ModuleId>>(new Set());

  useEffect(() => {
    let unsubUnlocks: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubUnlocks?.();
      if (!user) {
        setUnlocks(new Set());
        return;
      }
      unsubUnlocks = onSnapshot(
        collection(db, 'user-unlocks', user.uid, 'modules'),
        (snap) => {
          const ids = new Set<ModuleId>();
          snap.forEach((d) => ids.add(d.id as ModuleId));
          setUnlocks(ids);
        }
      );
    });
    return () => {
      unsubUnlocks?.();
      unsubAuth();
    };
  }, []);

  return unlocks;
}
