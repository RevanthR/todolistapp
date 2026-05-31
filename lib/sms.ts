const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

async function call(params: Record<string, string>): Promise<void> {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log('[DEV] SMS (no API key set):', params);
    return;
  }

  const url = new URL(FAST2SMS_URL);
  Object.entries({ authorization: process.env.FAST2SMS_API_KEY, ...params }).forEach(
    ([k, v]) => url.searchParams.set(k, v)
  );

  const res = await fetch(url.toString(), { method: 'GET' });
  const data = await res.json();
  if (!data.return) {
    console.error('Fast2SMS error:', data);
  }
}

// OTP — Fast2SMS built-in OTP route (no template needed, sends "Your OTP is XXXXXX")
export async function sendOTP(phone: string, otp: string): Promise<void> {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }
  await call({
    route: 'otp',
    variables_values: otp,
    flash: '0',
    numbers: phone,
  });
}

// Weekly reminder — Monday nudge for users who haven't started their week
export async function sendWeeklyReminder(phone: string, name: string): Promise<void> {
  await call({
    route: 'q',
    message: `Hey ${name}! A new week has started. Set your goals on Grow Together and keep the momentum going with your group!`,
    flash: '0',
    numbers: phone,
  });
}

// Daily reminder — evening nudge for users with pending items
export async function sendDailyReminder(phone: string, name: string, pendingCount: number): Promise<void> {
  await call({
    route: 'q',
    message: `Hey ${name}! You have ${pendingCount} goal${pendingCount > 1 ? 's' : ''} still pending this week on Grow Together. Keep pushing!`,
    flash: '0',
    numbers: phone,
  });
}
