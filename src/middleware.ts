import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Target your secret admin path
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');

    // 2. If the session cookie is missing or incorrect, redirect to 404
    if (!session || session.value !== 'verified_access_granted') {
      // We rewrite to 404 so the URL doesn't even change, making it look totally dead
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure this only runs on your admin paths to save performance
export const config = {
  matcher: '/portal-x93-private-access/:path*',
};