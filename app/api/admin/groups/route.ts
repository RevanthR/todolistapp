import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { groups, groupMembers, users } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

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

  const allGroups = await db.select().from(groups).orderBy(desc(groups.createdAt));

  const groupData = await Promise.all(
    allGroups.map(async (group) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, group.createdBy))
        .limit(1);

      return {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        memberCount: Number(count),
        createdBy: creator?.name ?? creator?.phone ?? '—',
        createdAt: group.createdAt,
      };
    })
  );

  return NextResponse.json({ groups: groupData });
}
