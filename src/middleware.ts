import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Get hostname (e.g. employee.xyz-sa.site, admin.xyz-sa.site, localhost:3000)
  const hostname = req.headers.get('host') || '';

  // Prevent rewriting for API routes or static files
  if (url.pathname.startsWith('/api') || url.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Subdomain: employee
  if (hostname.startsWith('employee.')) {
    // Only rewrite if it's not already pointing to /employee (to prevent infinite loops in some setups)
    if (!url.pathname.startsWith('/employee')) {
      url.pathname = `/employee${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Subdomain: admin
  if (hostname.startsWith('admin.')) {
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
