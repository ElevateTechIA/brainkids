import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, verifyIdToken } from '@/lib/firebase/admin';
import { TOKEN_RULES } from '@/lib/tokens/config';

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(req.headers.get('authorization'));
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({}));
    const deviceId: string = (body.deviceId || '').toString().slice(0, 128);
    const referrerUid: string | null = body.referrerUid
      ? body.referrerUid.toString().slice(0, 128)
      : null;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId required' }, { status: 400 });
    }

    const creditsRef = adminDb.doc(`user-credits/${uid}`);
    const existing = await creditsRef.get();
    if (existing.exists) {
      return NextResponse.json({
        balance: existing.data()?.balance || 0,
        alreadyRegistered: true,
      });
    }

    const validReferrer =
      referrerUid && referrerUid !== uid
        ? (await adminDb.doc(`users/${referrerUid}`).get()).exists
        : false;

    const deviceRef = adminDb.doc(`device-claims/${deviceId}`);
    const deviceSnap = await deviceRef.get();
    const deviceAlreadyClaimed = deviceSnap.exists;

    let welcomeAmount: number = TOKEN_RULES.welcomeWithoutReferral;
    let referralCredited = false;

    if (deviceAlreadyClaimed) {
      welcomeAmount = 0;
    } else if (validReferrer) {
      welcomeAmount = TOKEN_RULES.welcomeWithReferral;
      referralCredited = true;
    }

    const batch = adminDb.batch();

    batch.set(creditsRef, {
      uid,
      balance: welcomeAmount,
      lifetimePurchased: 0,
      lifetimeUsed: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.set(adminDb.doc(`users/${uid}`), {
      uid,
      email: decoded.email || null,
      displayName: decoded.name || null,
      referredBy: referralCredited ? referrerUid : null,
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (welcomeAmount > 0) {
      batch.set(adminDb.collection('transactions').doc(), {
        uid,
        amount: welcomeAmount,
        type: 'welcome',
        meta: { referredBy: referralCredited ? referrerUid : null, deviceId },
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    if (!deviceAlreadyClaimed) {
      batch.set(deviceRef, {
        deviceId,
        uid,
        claimedAt: FieldValue.serverTimestamp(),
      });
    }

    if (referralCredited && referrerUid) {
      const referrerCreditsRef = adminDb.doc(`user-credits/${referrerUid}`);
      const referrerSnap = await referrerCreditsRef.get();
      if (referrerSnap.exists) {
        batch.update(referrerCreditsRef, {
          balance: FieldValue.increment(TOKEN_RULES.referrerReward),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        batch.set(referrerCreditsRef, {
          uid: referrerUid,
          balance: TOKEN_RULES.referrerReward,
          lifetimePurchased: 0,
          lifetimeUsed: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      batch.set(adminDb.collection('transactions').doc(), {
        uid: referrerUid,
        amount: TOKEN_RULES.referrerReward,
        type: 'referral_reward',
        meta: { referredUid: uid },
        createdAt: FieldValue.serverTimestamp(),
      });

      batch.set(adminDb.collection('referrals').doc(), {
        referrerUid,
        referredUid: uid,
        deviceId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return NextResponse.json({
      balance: welcomeAmount,
      referralCredited,
    });
  } catch (err) {
    console.error('[register]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
