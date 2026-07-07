import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { getWeekStart } from '@/lib/utils';
import { and, eq, ne } from 'drizzle-orm';

function getPrevWeekStart(): string {
  const d = new Date(getWeekStart() + 'T00:00:00');
  d.setDate(d.getDate() - 7);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// GET — fetch incomplete items from last week
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const prevWeek = getPrevWeekStart();

  const [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(and(eq(weeklyTodos.userId, auth.userId), eq(weeklyTodos.weekStart, prevWeek)))
    .limit(1);

  if (!todo) return NextResponse.json({ spillovers: [] });

  const incomplete = await db
    .select()
    .from(todoItems)
    .where(and(eq(todoItems.weeklyTodoId, todo.id), ne(todoItems.status, 'done')));

  return NextResponse.json({ spillovers: incomplete, prevWeek });
}
