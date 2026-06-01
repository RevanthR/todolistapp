// OTP via 2Factor.in (SMS, no DLT needed)
// Reminders via Fast2SMS WhatsApp Manager (Utility templates)

async function sendWhatsApp(templateId: string, numbers: string, variables: string[]): Promise<void> {
  const apiKey = process.env.FAST2SMS_WA_API_KEY ?? process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] WhatsApp template ${templateId} to ${numbers}:`, variables);
    return;
  }

  const body = new URLSearchParams({
    authorization: apiKey,
    template_id: templateId,
    numbers,
    variables: variables.join(','),
  });

  const res = await fetch('https://www.fast2sms.com/dev/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!data.return) {
    console.error('Fast2SMS WhatsApp error:', data);
  }
}

// OTP via 2Factor SMS
export async function sendOTP(phone: string, otp: string): Promise<void> {
  if (!process.env.TWOFACTOR_API_KEY) {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    throw new Error('TWOFACTOR_API_KEY not set');
  }

  const url = `https://2factor.in/API/V1/${process.env.TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/Grow%20Together`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.Status !== 'Success') {
    console.error('2Factor error:', data);
    throw new Error('Failed to send OTP');
  }
}

// Weekly reminder — growtogether_weekly_nudge
// "Hello {{1}}, your weekly task list on Grow Together has not been created yet..."
export async function sendWeeklyReminder(phone: string, name: string): Promise<void> {
  const templateId = process.env.FAST2SMS_WA_WEEKLY_TEMPLATE;
  if (!templateId) return;
  await sendWhatsApp(templateId, phone, [name]);
}

// Daily reminder — growtogether_daily_nudge
// "Hello {{1}}, you have {{2}} pending task(s) on Grow Together..."
export async function sendDailyReminder(phone: string, name: string, pendingCount: number): Promise<void> {
  const templateId = process.env.FAST2SMS_WA_DAILY_TEMPLATE;
  if (!templateId) return;
  await sendWhatsApp(templateId, phone, [name, String(pendingCount)]);
}
