import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId, getWeekStart } from '@/lib/utils';
import { and, eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const weekParam = req.nextUrl.searchParams.get('week');
  const weekStart = weekParam ?? getWeekStart();

  const [todo] = await db
    .select()
    .from(weeklyTodos)
    .where(and(eq(weeklyTodos.userId, auth.userId), eq(weeklyTodos.weekStart, weekStart)))
    .limit(1);

  if (!todo) {
    return NextResponse.json({ todo: null, items: [], weekStart });
  }

  const items = await db
    .select()
    .from(todoItems)
    .where(eq(todoItems.weeklyTodoId, todo.id))
    .orderBy(todoItems.createdAt);

  return NextResponse.json({ todo, items, weekStart });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const weekStart = getWeekStart();

  const [existing] = await db
    .select()
    .from(weeklyTodos)
    .where(and(eq(weeklyTodos.userId, auth.userId), eq(weeklyTodos.weekStart, weekStart)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ todo: existing });
  }

  const id = generateId();
  await db.insert(weeklyTodos).values({ id, userId: auth.userId, weekStart });

  const [todo] = await db.select().from(weeklyTodos).where(eq(weeklyTodos.id, id)).limit(1);

  return NextResponse.json({ todo }, { status: 201 });
}

// GET all weeks for history navigation
export async function HEAD(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return new NextResponse(null, { status: 401 });
  return new NextResponse(null, { status: 200 });
}
