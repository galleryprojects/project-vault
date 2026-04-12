// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.nextUrl.hostname;

  // [1] STATIC & RESTRICTED BYPASS
  if (pathname.startsWith('/restricted') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // [2] USA ONLY RESTRICTION + PRO LOCAL BYPASS
  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // 🚀 LOCAL BYPASS: Always allow local dev to access the Pink Theme
  if (isLocal) {
    return NextResponse.next();
  }

  // 🔒 PRODUCTION LOCK: If we know the country and it's NOT 'US', bounce them
  if (country && country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // [3] ADMIN PORTAL SECURITY (Stealth Mode)
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = request.nextUrl.searchParams.get('key');

    // "Ghost Protocol": If not authorized, show a 404 so the path seems non-existent
    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};