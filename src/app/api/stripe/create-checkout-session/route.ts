import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getPackage } from '@/lib/tokens/config';
import { getStripe, getAppUrl } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const decoded = await verifyIdToken(req.headers.get('authorization'));
    const body = await req.json().catch(() => ({}));
    const packageId: string = (body.packageId || '').toString();
    const locale: string = (body.locale || 'es').toString().slice(0, 5);

    const pack = getPackage(packageId);
    if (!pack) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const appUrl = getAppUrl();
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: decoded.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: pack.priceUsd * 100,
            product_data: {
              name: `BrainKids ${pack.label} - ${pack.tokens} tokens`,
              description: `${pack.tokens} tokens to unlock advanced learning modules`,
            },
          },
        },
      ],
      metadata: {
        uid: decoded.uid,
        packageId: pack.id,
        tokens: String(pack.tokens),
      },
      success_url: `${appUrl}/${locale}/parent/tokens/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/parent/tokens/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
