import { db } from './db';
import { weeklyTodos, todoItems } from './db/schema';
import { and, eq, or, ne, gte, lt } from 'drizzle-orm';

// Incomplete items from any week before `beforeWeek`, plus items from those
// weeks that were completed on/after the start of `beforeWeek` — so a
// carried-over task keeps showing up until it's done, and stays visible for
// the one week in which it actually gets completed.
export async function getSpillovers(userId: string, beforeWeek: string) {
  const beforeWeekStart = new Date(beforeWeek + 'T00:00:00');

  const rows = await db
    .select({ item: todoItems })
    .from(todoItems)
    .innerJoin(weeklyTodos, eq(todoItems.weeklyTodoId, weeklyTodos.id))
    .where(
      and(
        eq(weeklyTodos.userId, userId),
        lt(weeklyTodos.weekStart, beforeWeek),
        or(ne(todoItems.status, 'done'), gte(todoItems.updatedAt, beforeWeekStart))
      )
    )
    .orderBy(weeklyTodos.weekStart, todoItems.createdAt);

  return rows.map((r) => r.item);
}
