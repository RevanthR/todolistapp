import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { eq, and } from 'drizzle-orm';
import webpush from 'web-push';

// Subscribe
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  // Upsert — remove old, insert new
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, auth.userId));
  await db.insert(pushSubscriptions).values({
    id: generateId(),
    userId: auth.userId,
    subscription,
  });

  return NextResponse.json({ success: true });
}

// Unsubscribe
export async function DELETE(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, auth.userId));

  return NextResponse.json({ success: true });
}
