import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId, generateInviteCode } from '@/lib/utils';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get groups the user belongs to, with member count
  const memberships = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.userId, auth.userId));

  const groupIds = memberships.map((m) => m.groupId);
  if (groupIds.length === 0) return NextResponse.json({ groups: [] });

  const result = await Promise.all(
    groupIds.map(async (groupId) => {
      const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));
      return { ...group, memberCount: Number(count) };
    })
  );

  return NextResponse.json({ groups: result });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Group name must be at least 2 characters' }, { status: 400 });
  }

  const groupId = generateId();
  const inviteCode = generateInviteCode();

  await db.insert(groups).values({
    id: groupId,
    name: name.trim(),
    inviteCode,
    createdBy: auth.userId,
  });

  // Auto-join creator
  await db.insert(groupMembers).values({
    id: generateId(),
    groupId,
    userId: auth.userId,
  });

  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);

  return NextResponse.json({ group }, { status: 201 });
}
