import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { otpCodes, users } from '@/lib/db/schema';
import { signToken } from '@/lib/auth';
import { generateId } from '@/lib/utils';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // Find valid OTP
    const [record] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.code, otp),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 });
    }

    // Mark OTP as used
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, record.id));

    // Get or create user
    let [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    const isNewUser = !user;

    if (!user) {
      const id = generateId();
      await db.insert(users).values({ id, phone });
      [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    }

    const token = await signToken({ userId: user.id, phone: user.phone });

    const res = NextResponse.json({ success: true, isNewUser });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
