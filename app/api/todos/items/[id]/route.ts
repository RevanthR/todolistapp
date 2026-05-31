import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoItems, weeklyTodos } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const STATUS_CYCLE: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const [item] = await db.select().from(todoItems).where(eq(todoItems.id, id)).limit(1);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Verify ownership
  const [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(eq(weeklyTodos.id, item.weeklyTodoId))
    .limit(1);

  if (!todo || todo.userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: Partial<typeof item> = { updatedAt: new Date() };

  if ('cycleStatus' in body && body.cycleStatus) {
    updates.status = STATUS_CYCLE[item.status] ?? 'pending';
  } else {
    if ('status' in body) updates.status = body.status;
  }

  if ('note' in body) updates.note = body.note?.trim() || null;
  if ('title' in body) updates.title = body.title?.trim();
  if ('deadline' in body) updates.deadline = body.deadline || null;

  await db.update(todoItems).set(updates).where(eq(todoItems.id, id));

  const [updated] = await db.select().from(todoItems).where(eq(todoItems.id, id)).limit(1);

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [item] = await db.select().from(todoItems).where(eq(todoItems.id, id)).limit(1);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(eq(weeklyTodos.id, item.weeklyTodoId))
    .limit(1);

  if (!todo || todo.userId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(todoItems).where(eq(todoItems.id, id));

  return NextResponse.json({ success: true });
}
