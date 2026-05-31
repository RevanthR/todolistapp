import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-in-production');

const protectedPaths = ['/dashboard', '/group', '/profile'];
const authPaths = ['/login'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    try {
      await jwtVerify(token, secret);
    } catch {
      const res = NextResponse.redirect(new URL('/login', req.url));
      res.cookies.delete('token');
      return res;
    }
  }

  if (isAuthPage && token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } catch {
      const res = NextResponse.next();
      res.cookies.delete('token');
      return res;
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin/dashboard')) {
    const adminToken = req.cookies.get('admin_token')?.value;
    if (!adminToken) return NextResponse.redirect(new URL('/admin/login', req.url));
    try {
      await jwtVerify(adminToken, secret);
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/group/:path*', '/profile/:path*', '/login', '/admin/:path*'],
};
