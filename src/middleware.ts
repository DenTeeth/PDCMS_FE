import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Simply pass through - locale will be handled by cookie
  return NextResponse.next();
}

export const config = {
  // Skip middleware for api, static files, etc.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
