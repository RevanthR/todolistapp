import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const sessionId = searchParams.get('SessionId') ?? searchParams.get('session_id');
  const status = searchParams.get('Status') ?? searchParams.get('status');
  const phone = searchParams.get('To') ?? searchParams.get('mobile');
  const details = searchParams.get('Details') ?? searchParams.get('details');

  console.log(`[Delivery Report] Phone: ${phone} | Status: ${status} | Session: ${sessionId} | Details: ${details}`);

  // 2Factor expects a 200 OK response
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  console.log('[Delivery Report]', body);
  return NextResponse.json({ success: true });
}
