// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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

  // Debugging: This will show up in your terminal where 'npm run dev' is running
  if (isLocal) {
    console.log(`[PROXY_DEBUG] Local Access Detected: ${pathname} (Bypassing Country Check)`);
  }

  // Only apply restriction if NOT local AND a country header exists that is NOT 'US'
  // If no header exists (like on some dev setups), we default to allowing it.
  if (!isLocal && country && country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // [3] ADMIN PORTAL SECURITY (Media Ledger & Vault Access)
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = searchParams.get('key');

    // If no verified session and no magic key, show 404 to hide the path
    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};