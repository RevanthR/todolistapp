import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { otpCodes } from '@/lib/db/schema';
import { sendOTP } from '@/lib/sms';
import { generateOTP, generateId } from '@/lib/utils';
import { and, eq, gt } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid 10-digit phone number' }, { status: 400 });
    }

    // Check for a recent unused OTP (rate-limit: 1 per minute)
    const recent = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phone, phone),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date(Date.now() - 60_000))
        )
      )
      .limit(1);

    if (recent.length > 0) {
      return NextResponse.json({ error: 'Please wait a minute before requesting another OTP' }, { status: 429 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(otpCodes).values({
      id: generateId(),
      phone,
      code: otp,
      expiresAt,
      used: false,
    });

    await sendOTP(phone, otp);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
