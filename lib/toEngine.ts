import type { Artwork } from './types';
import { sizeText, priceOrStatus, statusText, SHOW_PRICES } from './site';

const FRAME_SIDE: Record<string, number> = { black: 0x121212, oak: 0xc99d68, white: 0xeeeeea, original: 0x2a2420 };

/** Maps CMS fields onto what the 3D engine needs to hang, light and label a piece. */
export function toEngine(a: Artwork) {
  const base = {
    id: a.slug, slug: a.slug, title: a.title, kind: a.kind, medium: a.medium, year: a.year, story: a.story,
    priceText: SHOW_PRICES && a.status !== 'sold' && a.price != null ? priceOrStatus(a) : '', statusText: statusText(a), sold: a.status === 'sold', soldNote: a.soldNote || (a.status === 'sold' ? 'Sold' : ''),
    venue: a.status !== 'sold' && a.currentVenue ? { name: a.currentVenue.name, place: a.currentVenue.address, url: a.currentVenue.url || '#' } : undefined,
    pastVenue: a.pastVenue ? { name: a.pastVenue.name, place: a.pastVenue.address, url: a.pastVenue.url || '#' } : undefined,
    frameText: a.frameText, sizeText: sizeText(a), frame: 'none',
    image: { src: a.image.url, w: a.image.width, h: a.image.height },
  };
  // a sculpture with turntable photos turns through them, whatever display mode is set
  if (a.views && a.views.length >= 2 && (a.display === 'sculptureModel' || a.display === 'sculpturePhoto'))
    return { ...base, w: 0.8, sculpture: true, model: 'views', figH: (a.heightCm || 80) / 100, views: a.views.map((v) => ({ src: v.url, w: v.width, h: v.height })) };
  switch (a.display) {
    case 'cutout':
      return { ...base, w: (a.widthCm || 80) / 100, round: a.shape === 'round', cutWall: true };
    case 'sculptureModel':
      return { ...base, w: 1.0, sculpture: true, model: 'torso' };
    case 'sculpturePhoto':
      return { ...base, w: 0.8, sculpture: true, model: 'cutout', figH: (a.heightCm || 30) / 100 };
    default: {
      const frame = a.frame || 'none';
      return { ...base, w: (a.widthCm || 80) / 100, box: true, wrap: frame === 'none', side: FRAME_SIDE[frame] ?? 0x121212 };
    }
  }
}
