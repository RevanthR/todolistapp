import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, weeklyTodos, todoItems } from '@/lib/db/schema';
import { sendDailyReminder } from '@/lib/sms';
import { getWeekStart } from '@/lib/utils';
import { eq, and, ne } from 'drizzle-orm';

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
      await sendDailyReminder(user.phone, name, pendingItems.length);
      notified++;
    }
  }

  return NextResponse.json({ success: true, notified });
}
