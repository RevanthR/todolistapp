// OTP via 2Factor.in (no DLT required for OTP)
// Reminders via Fast2SMS (requires DLT — fails silently if not set up)

export async function sendOTP(phone: string, otp: string): Promise<void> {
  if (!process.env.TWOFACTOR_API_KEY) {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    throw new Error('TWOFACTOR_API_KEY not set');
  }

  // SMS only — no voice fallback
  const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/Grow%20Together`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    console.error('2Factor error:', data);
    throw new Error('Failed to send OTP');
  }
}

// Weekly reminder via Fast2SMS (needs DLT — fails silently if not set up)
export async function sendWeeklyReminder(phone: string, name: string): Promise<void> {
  if (!process.env.FAST2SMS_API_KEY) return;

  const url = new URL('https://www.fast2sms.com/dev/bulkV2');
  url.searchParams.set('authorization', process.env.FAST2SMS_API_KEY);
  url.searchParams.set('route', 'q');
  url.searchParams.set('message', `Hey ${name}! A new week has started. Set your goals on Grow Together and keep the momentum going with your group!`);
  url.searchParams.set('flash', '0');
  url.searchParams.set('numbers', phone);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.return) console.error('Fast2SMS reminder error:', data);
}

// Daily reminder via Fast2SMS (needs DLT — fails silently if not set up)
export async function sendDailyReminder(phone: string, name: string, pendingCount: number): Promise<void> {
  if (!process.env.FAST2SMS_API_KEY) return;

  const url = new URL('https://www.fast2sms.com/dev/bulkV2');
  url.searchParams.set('authorization', process.env.FAST2SMS_API_KEY);
  url.searchParams.set('route', 'q');
  url.searchParams.set('message', `Hey ${name}! You have ${pendingCount} goal${pendingCount > 1 ? 's' : ''} still pending this week on Grow Together. Keep pushing!`);
  url.searchParams.set('flash', '0');
  url.searchParams.set('numbers', phone);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!data.return) console.error('Fast2SMS reminder error:', data);
}
