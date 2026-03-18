import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_SEGMENT = process.env.ADMIN_SECRET_URL_SEGMENT ?? '';
const ALLOWED_IPS = process.env.ALLOWED_ADMIN_IPS?.split(',').map(s => s.trim()) ?? [];

export function middleware(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const path = request.nextUrl.pathname;

    const isAdminPath =
      ADMIN_SEGMENT && path.startsWith(`/admin-${ADMIN_SEGMENT}`);

    const isHoneypot =
      path === '/admin' ||
      (path.startsWith('/admin/') && !isAdminPath);

    const token = request.cookies.get('sb-access-token')?.value;

    // 🪤 Honeypot (SAFE)
    if (isHoneypot) {
      return NextResponse.rewrite(new URL('/not-found', request.url));
    }

    // 🔐 Admin protection (LIGHT ONLY)
    if (isAdminPath) {
      // IP check
      if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(ip)) {
        return NextResponse.rewrite(new URL('/not-found', request.url));
      }

      // Auth check
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
