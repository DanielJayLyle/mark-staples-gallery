import { createClient } from '@sanity/client';
import { SEED } from '@/content/seed';
import { sanityConfig, sanityEnabled } from './site';
import type { Artwork } from './types';

const QUERY = `*[_type == "artwork" && defined(slug.current)] | order(order asc, _createdAt desc){
  "slug": slug.current, title, kind, medium, year, status, price, display, shape,
  widthCm, heightCm, depthCm, frame, frameText, story, soldNote,
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
