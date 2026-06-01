import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId, getWeekStart } from '@/lib/utils';
import { and, eq, ne, lt } from 'drizzle-orm';

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

// POST — carry over selected items into current week
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemIds } = await req.json();
  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return NextResponse.json({ error: 'No items selected' }, { status: 400 });
  }

  const weekStart = getWeekStart();

  // Ensure this week exists
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

  // Copy each selected item into this week, reset status to pending
  const carried: typeof todoItems.$inferSelect[] = [];
  for (const itemId of itemIds) {
    const [orig] = await db.select().from(todoItems).where(eq(todoItems.id, itemId)).limit(1);
    if (!orig) continue;

    const newId = generateId();
    await db.insert(todoItems).values({
      id: newId,
      weeklyTodoId: todo.id,
      title: orig.title,
      deadline: null, // user picks new deadline
      status: 'pending',
      note: orig.note,
      updatedAt: new Date(),
    });
    const [newItem] = await db.select().from(todoItems).where(eq(todoItems.id, newId)).limit(1);
    carried.push(newItem);
  }

  return NextResponse.json({ carried, todo });
}
