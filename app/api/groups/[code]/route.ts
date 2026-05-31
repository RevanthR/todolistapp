import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, groupMembers, users, weeklyTodos, todoItems } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { getWeekStart, maskPhone } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await params;

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.inviteCode, code.toUpperCase()))
    .limit(1);

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  // Verify the requester is a member
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, auth.userId)))
    .limit(1);

  if (!membership) return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });

  // Get all members
  const members = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, group.id));

  const weekStart = getWeekStart();

  const memberData = await Promise.all(
    members.map(async (m) => {
      const [user] = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);

      const [todo] = await db
        .select()
        .from(weeklyTodos)
        .where(and(eq(weeklyTodos.userId, m.userId), eq(weeklyTodos.weekStart, weekStart)))
        .limit(1);

      let items: typeof todoItems.$inferSelect[] = [];

      if (todo) {
        items = await db
          .select()
          .from(todoItems)
          .where(eq(todoItems.weeklyTodoId, todo.id))
          .orderBy(todoItems.createdAt);
      }

      const totalItems = items.length;
      const doneItems = items.filter((i) => i.status === 'done').length;
      const progress = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

      return {
        id: user.id,
        name: user.name || maskPhone(user.phone),
        phone: maskPhone(user.phone),
        isYou: user.id === auth.userId,
        totalItems,
        doneItems,
        progress,
        hasStartedWeek: !!todo,
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          deadline: i.deadline,
          status: i.status,
          note: i.note,
        })),
      };
    })
  );

  // Sort: you first, then by progress desc
  memberData.sort((a, b) => {
    if (a.isYou) return -1;
    if (b.isYou) return 1;
    return b.progress - a.progress;
  });

  return NextResponse.json({ group, members: memberData });
}
