import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/* Point a Sanity webhook at /api/revalidate?secret=... so a published change appears on the site within seconds. */
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  revalidatePath('/', 'layout');
  return NextResponse.json({ revalidated: true });
}
