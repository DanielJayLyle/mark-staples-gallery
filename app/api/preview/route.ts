import { NextResponse } from 'next/server';
import { COOKIE, passHash } from '@/middleware';

export async function POST(req: Request) {
  const form = await req.formData();
  const next = String(form.get('next') || '/');
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const pw = process.env.SITE_PASSWORD;
  const ok = !pw || (await passHash(String(form.get('password') || ''))) === (await passHash(pw));
  const res = NextResponse.redirect(new URL(ok ? safe : `/preview?wrong=1&next=${encodeURIComponent(safe)}`, req.url), 303);
  if (ok && pw) res.cookies.set(COOKIE, await passHash(pw), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return res;
}
