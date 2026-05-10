import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

const KYC_REQUIRED_ROUTES = [
   '/dashboard/transfers', '/dashboard/transactions',
  '/dashboard/cards', '/dashboard/loans', '/dashboard/investments',
  '/dashboard/bills', '/dashboard/crypto', '/dashboard/cheques',
];

const PROTECTED_ROUTES = [
  '/dashboard', '/accounts', '/transfers', '/transactions',
  '/cards', '/loans', '/investments', '/bills', '/crypto',
  '/cheques', '/kyc', '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── User cookies ──
  const userToken  = request.cookies.get('nexabank_token')?.value;
  const userRole   = request.cookies.get('nexabank_role')?.value;
  const kycStatus  = request.cookies.get('nexabank_kyc_status')?.value;
  const isUserAuth = !!userToken;
  const isUserAdmin = userRole === 'admin' || userRole === 'super_admin';

  // ── Admin cookies (completely separate from user cookies) ──
  const adminToken  = request.cookies.get('nx_admin_token')?.value;
  const adminRole   = request.cookies.get('nx_admin_role')?.value;
  const isAdminAuth = !!adminToken;
  const isAdminRole = adminRole === 'admin' || adminRole === 'super_admin';

  // ══════════════════════════════════════════════════════════════
  // ADMIN ROUTES  →  check ONLY admin cookies
  // ══════════════════════════════════════════════════════════════

  // Admin login page — always public (redirect if already authed as admin)
  if (pathname === '/auth/admin/login') {
    if (isAdminAuth && isAdminRole) {
      return NextResponse.redirect(new URL('/admin/admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // All other /admin/* routes require valid admin session
  if (pathname.startsWith('/admin')) {
    if (!isAdminAuth) {
      return NextResponse.redirect(new URL('/auth/admin/login', request.url));
    }
    if (!isAdminRole) {
      // Has an admin cookie but wrong role — clear and redirect
      const res = NextResponse.redirect(new URL('/auth/admin/login', request.url));
      res.cookies.delete('nx_admin_token');
      res.cookies.delete('nx_admin_refresh');
      res.cookies.delete('nx_admin_id');
      res.cookies.delete('nx_admin_role');
      return res;
    }
    return NextResponse.next();
  }

  // ══════════════════════════════════════════════════════════════
  // USER ROUTES  →  check ONLY user cookies (unchanged from before)
  // ══════════════════════════════════════════════════════════════

  if (isUserAuth && PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL(
      isUserAdmin ? '/admin/dashboard' : '/dashboard',
      request.url,
    ));
  }

  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r)) && !isUserAuth) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (
    isUserAuth &&
    kycStatus &&
    kycStatus !== 'approved' &&
    KYC_REQUIRED_ROUTES.some(r => pathname.startsWith(r))
  ) {
    const url = new URL('/dashboard/kyc', request.url);
    url.searchParams.set('required', '1');
    return NextResponse.redirect(url);
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(
      isUserAuth ? (isUserAdmin ? '/admin/admin/dashboard' : '/dashboard') : '/login',
      request.url,
    ));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};