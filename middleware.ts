import { NextResponse, type NextRequest } from 'next/server';

/* Temporary password wall for the preview period. On only while SITE_PASSWORD is set in Vercel:
   delete that variable and redeploy to open the site to everyone. */
export const COOKIE = 'ms_preview';
export async function passHash(pw: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ms11:' + pw.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
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
  matcher: ['/((?!preview|api/preview|api/revalidate|_next/|email/|fonts/|og.jpg|favicon|apple-touch-icon.png|tag.svg|logo-full.svg|robots.txt).*)'],
};
