import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export default async function Home() {
  const store = await cookies();
  const token = store.get('token')?.value;

  if (token) {
    try {
      await verifyToken(token);
      redirect('/dashboard');
    } catch {
      // invalid token, fall through to login
    }
  }

  redirect('/login');
}
