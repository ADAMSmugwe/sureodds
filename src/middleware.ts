import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/vip', '/pricing'];

// Routes that require active subscription
const vipRoutes = ['/vip'];

// Routes that require admin role
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the user's session token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isVipRoute = vipRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If it's not a protected route, allow access
  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // If user is not logged in, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check for admin routes
  if (isAdminRoute && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check for VIP routes - subscription check
  // Note: For real-time subscription checking, we need to verify in the page itself
  // This middleware provides a fast first-pass check based on the JWT
  if (isVipRoute && !token.hasActiveSubscription) {
    const pricingUrl = new URL('/pricing', request.url);
    pricingUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(pricingUrl);
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
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
