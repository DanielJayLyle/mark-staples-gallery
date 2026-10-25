import { createClient } from '@sanity/client';
import { SEED, COLLECTIONS } from '@/content/seed';
import { sanityConfig, sanityEnabled } from './site';
import type { Artwork, Collection } from './types';

const QUERY = `*[_type == "artwork" && defined(slug.current)] | order(order asc, _createdAt desc){
  "slug": slug.current, title, kind, medium, year, status, price, display, shape,
  widthCm, heightCm, depthCm, frame, frameText, story, soldNote, featured,
  "collection": collection->{title, blurb, "slug": slug.current},
  "currentVenue": currentVenue->{name, address, url},
  "pastVenue": pastVenue->{name, address, url},
  "image": {
    "url": image.asset->url + "?w=2000&fm=webp&q=88",
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
    "alt": image.alt
  }
}`;

export const sanityClient = sanityEnabled ? createClient({ ...sanityConfig, useCdn: true }) : null;

/** All artworks, in hanging order. Falls back to local seed content when Sanity isn't configured. */
export async function getArtworks(): Promise<Artwork[]> {
  if (!sanityClient) return SEED;
  try {
    const rows = await sanityClient.fetch<Artwork[]>(QUERY, {}, { next: { revalidate: 60, tags: ['artwork'] } });
    return rows.length ? rows : SEED;
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
  return (await getArtworks()).filter((a) => a.featured && !a.sample).slice(0, GALLERY_LIMIT);
}

/** Sections for the archive, in display order, each with its artworks. */
export async function getCollections(): Promise<{ collection: Collection; artworks: Artwork[] }[]> {
  const all = await getArtworks();
  let order: Collection[] = COLLECTIONS;
  if (sanityClient) {
    try {
      const rows = await sanityClient.fetch<Collection[]>(`*[_type=="collection"]|order(order asc){title, blurb, "slug": slug.current}`, {}, { next: { revalidate: 60, tags: ['artwork'] } });
      if (rows.length) order = rows;
    } catch {}
  }
  const groups = order.map((c) => ({ collection: c, artworks: all.filter((a) => a.collection?.slug === c.slug) })).filter((g) => g.artworks.length);
  const loose = all.filter((a) => !a.collection || !order.some((c) => c.slug === a.collection!.slug));
  return loose.length ? [...groups, { collection: { slug: 'more', title: 'More work' }, artworks: loose }] : groups;
}
