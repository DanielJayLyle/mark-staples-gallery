import { createClient } from '@sanity/client';
import { SEED, COLLECTIONS, STUDIO } from '@/content/seed';
import { sanityConfig, sanityEnabled } from './site';
import type { Artwork, Collection } from './types';

const QUERY = `*[_type == "artwork" && defined(slug.current)] | order(_createdAt desc){
  "slug": slug.current, "title": coalesce(title, ""), kind, medium, year, "status": coalesce(status, ""), price, display, shape,
  widthCm, heightCm, depthCm, frame, frameText, story, soldNote, note, rank, sizeEstimated,
  "featured": _id in *[_type == "room"][0].pieces[]._ref, "addedAt": coalesce(addedAt, _createdAt),
  "collection": collection->{title, blurb, story, "slug": slug.current},
  "photos": photos[]{
    _type == "video" => { "url": asset->url, "width": 1024, "height": 576, "video": true },
    _type != "video" => { "url": asset->url + "?w=1400&fm=webp&q=78", "thumb": asset->url + "?w=480&fm=webp&q=70",
      "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, "alt": alt } },
  "currentVenue": currentVenue->{name, address, url},
  "pastVenue": pastVenue->{name, address, url},
  "image": coalesce(image, photos[_type == "image"][0]){
    "url": asset->url + "?w=2000&fm=webp&q=88",
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height,
    "alt": alt
  }
}`;

/* The dataset is private (it also holds enquiries with people's details), so the site reads it with a
   server-only viewer token. Only published documents: drafts Mark is still working on never reach the site. */
export const sanityClient = sanityEnabled
  ? createClient({ ...sanityConfig, token: process.env.SANITY_API_READ_TOKEN, useCdn: true, perspective: 'published' })
  : null;

/* Untitled pieces get a simple name from their collection, e.g. "Doodle #37". The number comes from the
   piece's web address when it has one (stable), otherwise its place in the collection. */
const LABEL: Record<string, string> = {
  paintings: 'Painting', 'churchill-collection': 'Churchill', 'icons-collection': 'Icon', 'buddha-collection': 'Buddha', 'mirror-collection': 'Mirror',
  'models-clothing-and-boards': 'Object', 'always-doodling': 'Doodle', 'early-art': 'Early work', 'poetry-corner': 'Poem', misc: 'Misc',
};
function nameUntitled(all: Artwork[]): Artwork[] {
  const seen: Record<string, number> = {};
  return all.map((a) => {
    if (a.title) return a;
    const col = a.collection?.slug || 'more';
    seen[col] = (seen[col] || 0) + 1;
    const n = Number(a.slug.match(/-(\d+)$/)?.[1]) || seen[col];
    return { ...a, title: `${LABEL[col] || a.collection?.title || 'Piece'} #${n}` };
  });
}

/** All artworks. Falls back to local content when Sanity isn't configured. */
export async function getArtworks(): Promise<Artwork[]> {
  return nameUntitled(await fetchArtworks());
}
async function fetchArtworks(): Promise<Artwork[]> {
  if (!sanityClient) return SEED;
  try {
    const rows = await sanityClient.fetch<Artwork[]>(QUERY, {}, { next: { revalidate: 60, tags: ['artwork'] } });
    // skip anything half-finished: empty photo slots, or a piece with no photo at all
    const clean = rows
      .map((r) => {
        // all-round photos of a sculpture (built in for now) lead its photos
        const views = SEED.find((s) => s.slug === r.slug)?.views;
        return { ...r, views, image: views?.[0] ? { ...views[0], url: views[0].url } : r.image, photos: [...(views || []), ...(r.photos || []).filter((p) => p && p.url)] };
      })
      .filter((r) => r.image?.url && r.slug);
    return clean.length ? clean : SEED;
  } catch (e) {
    console.error('Sanity fetch failed, using seed content', e);
    return SEED;
  }
}

export async function getArtwork(slug: string) {
  const all = await getArtworks();
  const i = all.findIndex((a) => a.slug === slug);
  return i < 0 ? null : { artwork: all[i], prev: all[(i - 1 + all.length) % all.length], next: all[(i + 1) % all.length], all };
}

export const GALLERY_LIMIT = 15;

/** The pieces hanging in the 3D room: featured work, in hanging order, capped at 15. */
export async function getFeatured(): Promise<Artwork[]> {
  const all = await getArtworks();
  if (sanityClient) {
    try { // the "3D room" page in the CMS: a hand-ordered list of up to 15 pieces
      const slugs = await sanityClient.fetch<string[]>(`*[_type=="room"][0].pieces[]->slug.current`, {}, { next: { revalidate: 60, tags: ['artwork'] } });
      if (slugs?.length) return slugs.map((s) => all.find((a) => a.slug === s)).filter((a): a is Artwork => !!a).slice(0, GALLERY_LIMIT);
    } catch {}
  }
  return all.filter((a) => a.featured).slice(0, GALLERY_LIMIT);
}

/** A piece gets its own page only when there is something to say about it; the rest open in the lightbox. */
export const hasPage = (a: Artwork) => !!(a.featured || a.story || a.medium || a.year || (a.widthCm && a.heightCm) || a.currentVenue || a.pastVenue);

export async function getCollectionList(): Promise<Collection[]> {
  if (sanityClient) {
    try {
      const rows = await sanityClient.fetch<Collection[]>(`*[_type=="collection"]|order(order asc){title, blurb, story, "slug": slug.current}`, {}, { next: { revalidate: 60, tags: ['artwork'] } });
      if (rows.length) return rows;
    } catch {}
  }
  return COLLECTIONS.map(({ key, ...c }) => { void key; return c; });
}

/** Collections in page order, each with its pieces (newest first). */
export async function getCollections(): Promise<{ collection: Collection; artworks: Artwork[] }[]> {
  const [all, order] = await Promise.all([getArtworks(), getCollectionList()]);
  const lead = (a: Artwork, b: Artwork) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || (b.addedAt || '').localeCompare(a.addedAt || '');
  const groups = order.map((c) => ({ collection: c, artworks: all.filter((a) => a.collection?.slug === c.slug).sort(lead) })).filter((g) => g.artworks.length);
  const loose = all.filter((a) => !a.collection || !order.some((c) => c.slug === a.collection!.slug));
  return loose.length ? [...groups, { collection: { slug: 'more', title: 'More work' }, artworks: loose }] : groups;
}

export const RECENT_MONTHS = 12;
/** Recent pieces: everything added in the last 12 months, newest first. Nobody files anything into it. */
export async function getRecent(): Promise<Artwork[]> {
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - RECENT_MONTHS);
  const iso = cutoff.toISOString().slice(0, 10);
  return (await getArtworks()).filter((a) => (a.addedAt || '') >= iso).sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || '') || (a.rank ?? 1e9) - (b.rank ?? 1e9));
}

export async function getCollection(slug: string) {
  return (await getCollections()).find((g) => g.collection.slug === slug) || null;
}

export async function getStudio() { return STUDIO; }
