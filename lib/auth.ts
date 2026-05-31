import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');

export async function signToken(payload: { userId: string; phone: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: string; phone: string };
}

export async function getAuth(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
