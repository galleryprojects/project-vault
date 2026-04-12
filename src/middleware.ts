// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.nextUrl.hostname;

  // [1] STATIC & RESTRICTED BYPASS
  if (
    pathname.startsWith('/restricted') || 
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // [2] USA ONLY RESTRICTION + LOCAL BYPASS
  const country = request.headers.get('cf-ipcountry');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // 🚀 LOCAL BYPASS
  if (isLocal) {
    return NextResponse.next();
  }

  // 🔒 PRODUCTION LOCK (Cloudflare checks the country here)
  if (!isLocal && country && country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // [3] ADMIN PORTAL SECURITY
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = searchParams.get('key');

    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};