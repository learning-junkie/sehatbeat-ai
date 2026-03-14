import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { NextFetchEvent } from 'next/server';

const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5173',
  'http://localhost:3000',
];

function corsHeaders(origin: string): Headers {
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', origin);
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  h.set('Access-Control-Max-Age', '86400');
  return h;
}

export default function middleware(req: NextRequest, evt: NextFetchEvent) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      const headers = corsHeaders(origin);
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers });
      }
      const res = NextResponse.next();
      headers.forEach((value, key) => res.headers.set(key, value));
      return res;
    }
  }
  return clerkMiddleware()(req, evt);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};