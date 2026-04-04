import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * [ SECURITY ] THE_INVISIBILITY_CLOAK
 * Next.js 16 requires the function name to be 'proxy'
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect the Admin Portal
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');

    // 2. If not verified, ghost the route with a 404
    if (!session || session.value !== 'verified_access_granted') {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

// Speed Optimization: Don't run this check on images or CSS
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};