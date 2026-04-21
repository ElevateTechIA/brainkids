import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { getStripe } from '@/lib/stripe';
import { getPackage } from '@/lib/tokens/config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  const stripe = getStripe();
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('[webhook] sig verify failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, unpaid: true });
  }

  const uid = session.metadata?.uid;
  const packageId = session.metadata?.packageId;
  if (!uid || !packageId) {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const pack = getPackage(packageId);
  if (!pack) {
    return NextResponse.json({ error: 'Unknown package' }, { status: 400 });
  }

  const sessionRef = adminDb.doc(`checkout-sessions/${session.id}`);
  const creditsRef = adminDb.doc(`user-credits/${uid}`);

  try {
    await adminDb.runTransaction(async (tx) => {
      const sessionSnap = await tx.get(sessionRef);
      if (sessionSnap.exists && sessionSnap.data()?.status === 'completed') {
        return;
      }

      const creditsSnap = await tx.get(creditsRef);
      if (creditsSnap.exists) {
        tx.update(creditsRef, {
          balance: FieldValue.increment(pack.tokens),
          lifetimePurchased: FieldValue.increment(pack.tokens),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        tx.set(creditsRef, {
          uid,
          balance: pack.tokens,
          lifetimePurchased: pack.tokens,
          lifetimeUsed: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      tx.set(sessionRef, {
        sessionId: session.id,
        uid,
        packageId,
        tokens: pack.tokens,
        amountUsd: pack.priceUsd,
        status: 'completed',
        completedAt: FieldValue.serverTimestamp(),
      });

      tx.set(adminDb.collection('transactions').doc(), {
        uid,
        amount: pack.tokens,
        type: 'purchase',
        meta: { sessionId: session.id, packageId, amountUsd: pack.priceUsd },
        createdAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (err) {
    console.error('[webhook] tx failed', err);
    return NextResponse.json({ error: 'tx failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
