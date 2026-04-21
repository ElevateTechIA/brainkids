import { NextResponse } from 'next/server';
import { PACKAGES } from '@/lib/tokens/config';

export async function GET() {
  return NextResponse.json({ packages: PACKAGES });
}
