import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId, getWeekStart } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, deadline, note, weekStart: weekParam } = await req.json();

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!deadline) {
    return NextResponse.json({ error: 'Deadline is required' }, { status: 400 });
  }

  const weekStart = weekParam ?? getWeekStart();

  // Reject past weeks
  if (weekStart < getWeekStart()) {
    return NextResponse.json({ error: 'Cannot add items to past weeks' }, { status: 400 });
  }

  // Auto-create the weekly todo if it doesn't exist
  let [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(and(eq(weeklyTodos.userId, auth.userId), eq(weeklyTodos.weekStart, weekStart)))
    .limit(1);

  if (!todo) {
    const id = generateId();
    await db.insert(weeklyTodos).values({ id, userId: auth.userId, weekStart });
    [todo] = await db.select().from(weeklyTodos).where(eq(weeklyTodos.id, id)).limit(1);
  }

  const id = generateId();
  await db.insert(todoItems).values({
    id,
    weeklyTodoId: todo.id,
    title: title.trim(),
    deadline,
    note: note?.trim() || null,
    status: 'pending',
    updatedAt: new Date(),
  });

  const [item] = await db.select().from(todoItems).where(eq(todoItems.id, id)).limit(1);

  return NextResponse.json({ item }, { status: 201 });
}
