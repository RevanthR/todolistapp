import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, weeklyTodos, todoItems, pushSubscriptions } from '@/lib/db/schema';
import { sendDailyReminder } from '@/lib/sms';
import { sendPushNotification } from '@/lib/push';
import { getWeekStart } from '@/lib/utils';
import { eq, and, ne } from 'drizzle-orm';
import webpush from 'web-push';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekStart = getWeekStart();
  const allUsers = await db.select().from(users);
  let notified = 0;

  for (const user of allUsers) {
    const [todo] = await db
      .select()
      .from(weeklyTodos)
      .where(and(eq(weeklyTodos.userId, user.id), eq(weeklyTodos.weekStart, weekStart)))
      .limit(1);

    if (!todo) continue;

    const pendingItems = await db
      .select()
      .from(todoItems)
      .where(and(eq(todoItems.weeklyTodoId, todo.id), ne(todoItems.status, 'done')));

    if (pendingItems.length > 0) {
      const name = user.name?.split(' ')[0] ?? 'there';

      // WhatsApp
      await sendDailyReminder(user.phone, name, pendingItems.length);

      // Push notification
      const [sub] = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, user.id))
        .limit(1);

      if (sub) {
        const ok = await sendPushNotification(sub.subscription as webpush.PushSubscription, {
          title: 'Grow Together',
          body: `Hey ${name}! You have ${pendingItems.length} goal${pendingItems.length > 1 ? 's' : ''} still pending. Keep going!`,
          url: '/dashboard',
        });
        // Clean up expired subscription
        if (!ok) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      }

      notified++;
    }
  }

  return NextResponse.json({ success: true, notified });
}
