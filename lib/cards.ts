import type { Artwork, Photo } from './types';
import { hasPage } from './artworks';
import { statusText } from './site';

/** The small, serialisable slice of a piece that grids and the lightbox need. */
export type Card = {
  slug: string; title: string; alt: string; photos: Photo[]; status: string; statusText: string; sold: boolean;
  note?: string; venue?: string; collection?: string; collectionSlug?: string; page: boolean;
};

export function toCard(a: Artwork): Card {
  const photos = (a.photos?.length ? a.photos : [a.image]).map((p) => ({ ...p, alt: p.alt || a.image.alt || (a.title ? `${a.title} by Mark Staples` : 'Artwork by Mark Staples') }));
  return {
    slug: a.slug, title: a.title, alt: photos[0].alt!, photos, status: a.status, statusText: statusText(a), sold: a.status === 'sold',
    note: a.note, venue: a.status !== 'sold' && a.currentVenue ? a.currentVenue.name : undefined,
    collection: a.collection?.title, collectionSlug: a.collection?.slug, page: hasPage(a),
  };
}
