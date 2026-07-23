// Furnihub V2.0 · Next.js middleware for admin route protection
// Pitfall log:
//   - middleware runs on Edge runtime; cannot use Prisma or Node-only modules
//   - We only check the presence of the session cookie; full role check happens
//     server-side in admin pages / API routes via requireAdmin()
//
// Edge-compatible behavior:
//   - /admin/* paths redirect to /login if no session cookie present
//   - /api/admin/* paths return 401 if no session cookie
//   - Other paths pass through

import { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'furnihub_session';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hasSession = req.cookies.has(ADMIN_COOKIE);

  if (url.pathname.startsWith('/admin')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', url);
      loginUrl.searchParams.set('error', 'Admin login required');
      loginUrl.searchParams.set('redirect', url.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (url.pathname.startsWith('/api/admin')) {
    if (!hasSession) {
      return NextResponse.json({ error: 'Admin authentication required.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
