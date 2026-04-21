import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(req.headers.get('authorization'));
    const snap = await adminDb.doc(`user-credits/${decoded.uid}`).get();
    const data = snap.data();
    return NextResponse.json({
      balance: data?.balance || 0,
      lifetimePurchased: data?.lifetimePurchased || 0,
      lifetimeUsed: data?.lifetimeUsed || 0,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
