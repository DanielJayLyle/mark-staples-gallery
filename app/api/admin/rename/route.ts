import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { sanityConfig } from '@/lib/site';

/* One-off: Peggy is actually Twiggy. Preview deployments only (behind the Vercel login). Delete after use. */
export const dynamic = 'force-dynamic';
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') return NextResponse.json({ error: 'Not available here' }, { status: 404 });
  const client = createClient({ ...sanityConfig, token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false, perspective: 'raw' });
  const out: string[] = [];
  for (const id of ['artwork-peggy', 'drafts.artwork-peggy']) {
    const doc = await client.getDocument<{ photos?: { _key: string; alt?: string }[] }>(id);
    if (!doc) continue;
    const photos = (doc.photos || []).map((ph) => (ph.alt ? { ...ph, alt: ph.alt.replace(/Peggy/g, 'Twiggy') } : ph));
    await client.patch(id).set({ title: 'Twiggy', slug: { _type: 'slug', current: 'twiggy' }, photos }).commit();
    out.push(id);
  }
  return NextResponse.json({ ok: true, renamed: out });
}
