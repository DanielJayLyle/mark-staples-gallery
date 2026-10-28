import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { SEED, COLLECTIONS, ROOM_ORDER } from '@/content/seed';
import { sanityConfig } from '@/lib/site';
import type { Photo } from '@/lib/types';

/* One-off import of the site's built-in content into Sanity. Runs only on preview deployments (which sit
   behind the Vercel login) and uses the write token stored in Vercel. Safe to run twice: every document
   has a fixed id and Sanity skips photos it already has. Delete this route once the import is done. */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VENUE_ID: Record<string, string> = { 'Hatch & Barrel': 'venue-hatch-and-barrel', 'The Brighton Box Gallery': 'venue-brighton-box' };
const ref = (_ref: string) => ({ _type: 'reference', _ref });
let k = 0;
const key = () => (Date.now().toString(36) + (k++).toString(36)).slice(-12);

export async function GET(req: Request) {
  if (process.env.VERCEL_ENV !== 'preview' && process.env.NODE_ENV !== 'development') return NextResponse.json({ error: 'Not available here' }, { status: 404 });
  if (!sanityConfig.projectId || !process.env.SANITY_API_WRITE_TOKEN) return NextResponse.json({ error: 'Sanity project id or write token missing in Vercel' }, { status: 400 });
  const client = createClient({ ...sanityConfig, token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false });
  const q = new URL(req.url).searchParams;
  const step = q.get('step');

  const upload = async (p: Photo) => {
    const file = path.join(process.cwd(), 'public', p.url);
    const buf = await readFile(file);
    const asset = await client.assets.upload(p.video ? 'file' : 'image', buf, { filename: path.basename(file) });
    return asset._id;
  };

  if (step === 'base') {
    const tx = client.transaction();
    for (const a of SEED) for (const v of [a.currentVenue, a.pastVenue]) if (v && VENUE_ID[v.name])
      tx.createOrReplace({ _id: VENUE_ID[v.name], _type: 'venue', name: v.name, address: v.address, url: v.url });
    COLLECTIONS.forEach((c, i) => tx.createOrReplace({ _id: 'collection-' + c.key, _type: 'collection', title: c.title, slug: { _type: 'slug', current: c.slug },
      blurb: c.blurb, story: !!c.story, order: (i + 1) * 10 }));
    await tx.commit();
    return NextResponse.json({ ok: true, collections: COLLECTIONS.length, pieces: SEED.length });
  }

  if (step === 'pieces') {
    const from = Number(q.get('from') || 0), n = Math.min(10, Number(q.get('n') || 5));
    const done: string[] = [];
    for (const a of SEED.slice(from, from + n)) {
      const inRoom = ROOM_ORDER.includes(a.slug);
      const photos = inRoom ? (a.photos || []).slice(1) : (a.photos || []); // the room cut-out is stored separately below
      const items = [];
      for (const p of photos) {
        const id = await upload(p);
        items.push(p.video ? { _key: key(), _type: 'video', asset: ref(id) } : { _key: key(), _type: 'image', asset: ref(id), alt: p.alt });
      }
      const col = COLLECTIONS.find((c) => c.slug === a.collection?.slug);
      const doc: Record<string, unknown> = {
        _id: 'artwork-' + a.slug, _type: 'artwork', slug: { _type: 'slug', current: a.slug }, photos: items,
        title: a.title || undefined, status: a.status || '', addedAt: a.addedAt, note: a.note, rank: a.rank,
        collection: col ? ref('collection-' + col.key) : undefined,
      };
      if (inRoom) {
        Object.assign(doc, {
          kind: a.kind, display: a.display, shape: a.shape || 'rect', frame: a.frame, widthCm: a.widthCm, heightCm: a.heightCm, depthCm: a.depthCm,
          sizeEstimated: !!a.sizeEstimated, soldNote: a.soldNote,
          currentVenue: a.currentVenue && VENUE_ID[a.currentVenue.name] ? ref(VENUE_ID[a.currentVenue.name]) : undefined,
          pastVenue: a.pastVenue && VENUE_ID[a.pastVenue.name] ? ref(VENUE_ID[a.pastVenue.name]) : undefined,
          image: { _type: 'image', asset: ref(await upload(a.image)) },
        });
      }
      for (const f of Object.keys(doc)) if (doc[f] === undefined) delete doc[f];
      await client.createOrReplace(doc as { _id: string; _type: string });
      done.push(a.slug);
    }
    return NextResponse.json({ ok: true, done, next: from + n < SEED.length ? from + n : null, total: SEED.length });
  }

  if (step === 'room') {
    await client.createOrReplace({ _id: 'room', _type: 'room', pieces: ROOM_ORDER.map((s) => ({ _key: key(), ...ref('artwork-' + s) })) });
    return NextResponse.json({ ok: true, room: ROOM_ORDER });
  }

  return NextResponse.json({ steps: ['base', 'pieces&from=0&n=5', 'room'] });
}
