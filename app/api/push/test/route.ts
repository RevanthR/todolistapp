import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { sendPushNotification } from '@/lib/push';
import webpush from 'web-push';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subs = await db.select().from(pushSubscriptions);
  let sent = 0;

  for (const sub of subs) {
    const ok = await sendPushNotification(sub.subscription as webpush.PushSubscription, {
      title: 'Grow Together 🌱',
      body: 'Push notifications are working! Your group is watching.',
      url: '/dashboard',
    });
    if (ok) sent++;
  }

  return NextResponse.json({ success: true, sent });
}
