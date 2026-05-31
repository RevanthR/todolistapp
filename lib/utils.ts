import { v4 as uuidv4 } from 'uuid';

export { uuidv4 as generateId };

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const endStr = end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return `${startStr} – ${endStr}`;
}

export function formatDeadline(deadline: string): string {
  const d = new Date(deadline + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 2) + 'x'.repeat(phone.length - 4) + phone.slice(-2);
}
