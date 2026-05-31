import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { users, weeklyTodos, todoItems } from '@/lib/db/schema';
import { getWeekStart } from '@/lib/utils';
import { eq, and, desc } from 'drizzle-orm';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret');

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const weekStart = getWeekStart();
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  const userData = await Promise.all(
    allUsers.map(async (user) => {
      const [todo] = await db
        .select()
        .from(weeklyTodos)
        .where(and(eq(weeklyTodos.userId, user.id), eq(weeklyTodos.weekStart, weekStart)))
        .limit(1);

      let doneCount = 0;
      let totalCount = 0;

      if (todo) {
        const items = await db.select().from(todoItems).where(eq(todoItems.weeklyTodoId, todo.id));
        totalCount = items.length;
        doneCount = items.filter((i) => i.status === 'done').length;
      }

      return {
        id: user.id,
        name: user.name ?? '—',
        phone: user.phone,
        joinedAt: user.createdAt,
        activeThisWeek: !!todo,
        goalsThisWeek: totalCount,
        doneThisWeek: doneCount,
      };
    })
  );

  return NextResponse.json({ users: userData });
}
