import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { users, groups, groupMembers, weeklyTodos, todoItems } from '@/lib/db/schema';
import { getWeekStart } from '@/lib/utils';
import { eq, and, gte, sql } from 'drizzle-orm';

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
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalGroups] = await db.select({ count: sql<number>`count(*)` }).from(groups);
  const [totalMembers] = await db.select({ count: sql<number>`count(*)` }).from(groupMembers);
  const [activeThisWeek] = await db
    .select({ count: sql<number>`count(distinct ${weeklyTodos.userId})` })
    .from(weeklyTodos)
    .where(eq(weeklyTodos.weekStart, weekStart));
  const [newUsersThisMonth] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));
  const [totalGoals] = await db.select({ count: sql<number>`count(*)` }).from(todoItems);
  const [completedGoals] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todoItems)
    .where(eq(todoItems.status, 'done'));

  return NextResponse.json({
    totalUsers: Number(totalUsers.count),
    totalGroups: Number(totalGroups.count),
    totalGroupMemberships: Number(totalMembers.count),
    activeThisWeek: Number(activeThisWeek.count),
    newUsersThisMonth: Number(newUsersThisMonth.count),
    totalGoals: Number(totalGoals.count),
    completedGoals: Number(completedGoals.count),
  });
}
