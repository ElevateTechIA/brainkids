import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { MODULE_COSTS, ModuleId } from '@/lib/tokens/config';

const MODULE_IDS: ModuleId[] = ['sadhana', 'philosophy'];

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(req.headers.get('authorization'));
    const body = await req.json().catch(() => ({}));
    const moduleId = (body.moduleId || '').toString() as ModuleId;

    if (!MODULE_IDS.includes(moduleId)) {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    const cost = MODULE_COSTS[moduleId];
    const uid = decoded.uid;
    const creditsRef = adminDb.doc(`user-credits/${uid}`);
    const unlockRef = adminDb.doc(`user-unlocks/${uid}/modules/${moduleId}`);

    const result = await adminDb.runTransaction(async (tx) => {
      const unlockSnap = await tx.get(unlockRef);
      if (unlockSnap.exists) {
        return { alreadyUnlocked: true, balance: 0, charged: 0 };
      }

      const creditsSnap = await tx.get(creditsRef);
      const balance = creditsSnap.data()?.balance || 0;
      if (balance < cost) {
        return { insufficient: true, balance, needed: cost };
      }

      tx.update(creditsRef, {
        balance: FieldValue.increment(-cost),
        lifetimeUsed: FieldValue.increment(cost),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.set(unlockRef, {
        moduleId,
        cost,
        unlockedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb.collection('transactions').doc(), {
        uid,
        amount: -cost,
        type: 'unlock',
        meta: { moduleId },
        createdAt: FieldValue.serverTimestamp(),
      });

      return { unlocked: true, balance: balance - cost, charged: cost };
    });

    if ('insufficient' in result) {
      return NextResponse.json(result, { status: 402 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('[unlock]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
