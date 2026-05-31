import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, groupMembers } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
  }

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!group) {
    return NextResponse.json({ error: 'Group not found. Check the invite code.' }, { status: 404 });
  }

  // Check already a member
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, auth.userId)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ group, alreadyMember: true });
  }

  await db.insert(groupMembers).values({
    id: generateId(),
    groupId: group.id,
    userId: auth.userId,
  });

  return NextResponse.json({ group, alreadyMember: false }, { status: 201 });
}
