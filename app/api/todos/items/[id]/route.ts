import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todoItems, weeklyTodos, groupMembers, users, pushSubscriptions } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push';
import { eq, and } from 'drizzle-orm';
import webpush from 'web-push';

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

  // Notify group members when a goal is marked done
  if (updates.status === 'done') {
    const [actingUser] = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
    const name = actingUser?.name?.split(' ')[0] ?? 'Someone';

    // Find all groups this user belongs to
    const memberships = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, auth.userId));

    for (const membership of memberships) {
      // Get other members in this group
      const others = await db
        .select()
        .from(groupMembers)
        .where(and(
          eq(groupMembers.groupId, membership.groupId),
          eq(groupMembers.userId, auth.userId)
        ));

      const allMembers = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, membership.groupId));

      for (const member of allMembers) {
        if (member.userId === auth.userId) continue;

        const [sub] = await db
          .select()
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.userId, member.userId))
          .limit(1);

        if (sub) {
          const ok = await sendPushNotification(sub.subscription as webpush.PushSubscription, {
            title: '🎉 Goal completed!',
            body: `${name} just completed "${updated.title}"`,
            url: `/group/${membership.groupId}`,
          });
          if (!ok) await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }
  }

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
