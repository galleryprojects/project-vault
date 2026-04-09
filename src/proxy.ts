import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. BYPASS CHECK: Allow static files (images, favicons) and the restricted page
  if (
    pathname.startsWith('/restricted') || 
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // 2. USA ONLY RESTRICTION
  // Railway/Cloudflare header. Defaults to 'US' for local dev testing.
  const country = request.headers.get('cf-ipcountry') || 'US';

  if (country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // 3. ADMIN PORTAL SECURITY (Godmode & Session check)
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = searchParams.get('key'); // The secret keyhole

    // If no session AND no 'godmode' key, show 404
    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};