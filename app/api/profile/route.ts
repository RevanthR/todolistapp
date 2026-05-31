import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ id: user.id, phone: user.phone, name: user.name });
}

export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name } = await req.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
  }

  await db.update(users).set({ name: name.trim() }).where(eq(users.id, auth.userId));

  return NextResponse.json({ success: true });
}
