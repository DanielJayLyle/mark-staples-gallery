import { NextResponse, type NextRequest } from 'next/server';

import { COOKIE, passHash } from '@/lib/preview';

/* The preview password wall (see lib/preview.ts). Next 16 calls this file "proxy". */

export async function proxy(req: NextRequest) {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return NextResponse.next();
  if (req.cookies.get(COOKIE)?.value === (await passHash(pw))) return NextResponse.next();
  const url = req.nextUrl.clone();
  if (url.pathname.startsWith('/api/')) return NextResponse.json({ error: 'This site is in preview.' }, { status: 401 });
  url.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  url.pathname = '/preview';
  const res = NextResponse.rewrite(url);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

// Everything except the wall itself, Next's own files, and the few public files emails and link previews need
export const config = {
  matcher: ['/((?!preview|api/preview|api/revalidate|_next/|_vercel/|email/|fonts/|og.jpg|favicon|apple-touch-icon.png|tag.svg|logo-full.svg|robots.txt).*)'],
};
