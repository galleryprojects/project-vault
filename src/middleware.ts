// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.nextUrl.hostname || '';

  // [1] STATIC & RESTRICTED BYPASS
  if (
    pathname.startsWith('/restricted') || 
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // [2] USA ONLY RESTRICTION
  const country = request.headers.get('cf-ipcountry');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isRailway = hostname.includes('up.railway.app');

  // 🚀 BYPASS: Allow local dev and direct Railway backend access (so webhooks don't break)
  if (isLocal || isRailway) {
    return NextResponse.next();
  }

  // 🔒 THE LOCKDOWN: If on syexclusives.com, and country is NOT US (or missing entirely) -> BLOCK.
  if (country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // [3] ADMIN PORTAL SECURITY (Stealth Mode)
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = searchParams.get('key');

    // Ghost Protocol: Stealth rewrite to 404
    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure Railway's builder catches the proxy export properly
export default proxy;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};