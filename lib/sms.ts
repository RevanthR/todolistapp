// OTP via 2Factor.in (SMS, no DLT needed)
// Reminders via Fast2SMS WhatsApp Manager (Utility templates)

async function sendWhatsApp(messageId: string, numbers: string, variables: string[]): Promise<void> {
  const apiKey = process.env.FAST2SMS_WA_API_KEY ?? process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] WhatsApp message ${messageId} to ${numbers}:`, variables);
    return;
  }

  const params = new URLSearchParams({
    authorization: apiKey,
    message_id: messageId,
    phone_number_id: process.env.FAST2SMS_WA_PHONE_NUMBER_ID ?? '',
    numbers,
  });

  if (variables.length > 0) {
    params.set('variables_values', variables.join('|'));
  }

  const res = await fetch(`https://www.fast2sms.com/dev/whatsapp?${params.toString()}`, {
    method: 'GET',
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

// Daily reminder — growtogether_daily_revanth (Message ID: 22185)
export async function sendDailyReminder(phone: string, name: string, pendingCount: number): Promise<void> {
  const messageId = process.env.FAST2SMS_WA_DAILY_TEMPLATE;
  if (!messageId) return;
  await sendWhatsApp(messageId, phone, [name, String(pendingCount)]);
}
