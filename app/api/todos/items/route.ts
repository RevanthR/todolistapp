import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId, getWeekStart } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, deadline, note } = await req.json();

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  if (!deadline) {
    return NextResponse.json({ error: 'Deadline is required' }, { status: 400 });
  }

  const weekStart = getWeekStart();

  const [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(and(eq(weeklyTodos.userId, auth.userId), eq(weeklyTodos.weekStart, weekStart)))
    .limit(1);

  if (!todo) {
    return NextResponse.json({ error: 'Start your week first' }, { status: 400 });
  }

  const id = generateId();
  await db.insert(todoItems).values({
    id,
    weeklyTodoId: todo.id,
    title: title.trim(),
    deadline: deadline || null,
    note: note?.trim() || null,
    status: 'pending',
    updatedAt: new Date(),
  });

  const [item] = await db.select().from(todoItems).where(eq(todoItems.id, id)).limit(1);

  return NextResponse.json({ item }, { status: 201 });
}
