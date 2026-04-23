import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES   = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
const ADMIN_ROUTES    = ['/admin'];
const PROTECTED_ROUTES = ['/dashboard', '/accounts', '/transfers', '/transactions',
  '/cards', '/loans', '/investments', '/bills', '/crypto', '/cheques', '/kyc', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token   = request.cookies.get('nexabank_token')?.value;
  const role    = request.cookies.get('nexabank_role')?.value;
  const isAuth  = !!token;

  // Redirect authenticated users away from auth pages
  if (isAuth && PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    const destination = role === 'admin' || role === 'super_admin'
      ? '/admin/dashboard'
      : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !isAuth) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!isAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    const destination = isAuth
      ? (role === 'admin' || role === 'super_admin' ? '/admin/dashboard' : '/dashboard')
      : '/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};