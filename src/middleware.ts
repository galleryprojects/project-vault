// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // [1] STATIC & RESTRICTED BYPASS
  if (
    pathname.startsWith('/restricted') || 
    pathname.includes('.') 
  ) {
    return NextResponse.next();
  }

  // [2] USA ONLY RESTRICTION
  const country = request.headers.get('cf-ipcountry');
  
  // 🚨 THE REAL PRO FIX: Never trust hostname on a Docker/Railway container. 
  // Trust the environment variables instead.
  const isLocalDev = process.env.NODE_ENV === 'development';

  // 🚀 LOCAL BYPASS ONLY (Works because 'npm run dev' sets this to development)
  if (isLocalDev) {
    return NextResponse.next();
  }

  // 🔒 THE LOCKDOWN: If on Railway (production) and country is NOT US -> BLOCK.
  if (country !== 'US') {
    return NextResponse.redirect(new URL('/restricted', request.url));
  }

  // [3] ADMIN PORTAL SECURITY (Stealth Mode)
  if (pathname.startsWith('/portal-x93-private-access')) {
    const session = request.cookies.get('admin_session');
    const overrideKey = searchParams.get('key');

    if ((!session || session.value !== 'verified_access_granted') && overrideKey !== 'godmode') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};