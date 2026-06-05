import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, weeklyTodos, todoItems, pushSubscriptions } from '@/lib/db/schema';
import { sendDailyReminder } from '@/lib/sms';
import { sendPushNotification } from '@/lib/push';
import { getWeekStart } from '@/lib/utils';
import { eq, and, ne } from 'drizzle-orm';
import webpush from 'web-push';

async function pushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const [sub] = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);
  if (!sub) return;
  const ok = await sendPushNotification(sub.subscription as webpush.PushSubscription, payload);
  if (!ok) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('secret');
  const authorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    querySecret === process.env.CRON_SECRET;
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get('type') ?? 'evening';
  const weekStart = getWeekStart();
  const allUsers = await db.select().from(users);
  let notified = 0;

  for (const user of allUsers) {
    const [todo] = await db
      .select()
      .from(weeklyTodos)
      .where(and(eq(weeklyTodos.userId, user.id), eq(weeklyTodos.weekStart, weekStart)))
      .limit(1);

    const name = user.name?.split(' ')[0] ?? 'there';

    if (type === 'morning') {
      if (!todo) {
        // Hasn't started the week
        await pushToUser(user.id, {
          title: 'Good morning! 🌅',
          body: `Hey ${name}, you haven't set your goals for this week yet. Start now!`,
          url: '/dashboard',
        });
      } else {
        const allItems = await db
          .select()
          .from(todoItems)
          .where(eq(todoItems.weeklyTodoId, todo.id));
        const done = allItems.filter((i) => i.status === 'done').length;
        const pending = allItems.filter((i) => i.status !== 'done').length;
        const progress = allItems.length === 0 ? 0 : Math.round((done / allItems.length) * 100);

        await pushToUser(user.id, {
          title: `Good morning, ${name}! 🌅`,
          body: pending > 0
            ? `You're ${progress}% through this week — ${pending} task${pending > 1 ? 's' : ''} still to go. Let's get it!`
            : `You've completed all your goals this week! Amazing work 🎉`,
          url: '/dashboard',
        });
      }
      notified++;
    }

    if (type === 'evening') {
      if (!todo) continue;

      const pendingItems = await db
        .select()
        .from(todoItems)
        .where(and(eq(todoItems.weeklyTodoId, todo.id), ne(todoItems.status, 'done')));

      if (pendingItems.length > 0) {
        // WhatsApp reminder
        await sendDailyReminder(user.phone, name, pendingItems.length);

        // Push notification
        await pushToUser(user.id, {
          title: 'Grow Together',
          body: `Hey ${name}! ${pendingItems.length} goal${pendingItems.length > 1 ? 's' : ''} still pending — keep pushing!`,
          url: '/dashboard',
        });

        notified++;
      }
    }
  }

  return NextResponse.json({ success: true, notified });
}
