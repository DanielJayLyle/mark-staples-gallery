export const SITE = {
  name: 'Mark Staples',
  // Set NEXT_PUBLIC_SITE_URL once Mark's domain is connected; until then Vercel's own address is used
  url: process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  description: 'Pop and street art by Mark Staples: original paintings, mirror art and sculpture. Walk the 3D gallery, see what is on show and enquire about any piece.',
};
/** Only the live production site may be indexed. Previews (the dev branch) and local runs are hidden from search engines. */
export const isProduction = process.env.VERCEL_ENV === 'production';

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
};
export const sanityEnabled = Boolean(sanityConfig.projectId);
/** Prices are switched off. Set NEXT_PUBLIC_SHOW_PRICES=true in Vercel to bring them back everywhere at once. */
export const SHOW_PRICES = process.env.NEXT_PUBLIC_SHOW_PRICES === 'true';
export const formatPrice = (n?: number) => (n == null ? 'Price on request' : '\u00a3' + n.toLocaleString('en-GB'));
type StatusLike = { status: string; price?: number; currentVenue?: { name: string } | null };
/** What to show where a price would go: the price (if switched on) or the piece's status. */
export const statusText = (a: StatusLike) =>
  a.status === 'sold' ? 'Sold' : a.status === 'reserved' ? 'Reserved' : a.status === 'notForSale' ? 'Not for sale' : a.currentVenue ? `On show at ${a.currentVenue.name}` : 'Available';
export const priceOrStatus = (a: StatusLike) => (SHOW_PRICES && a.status !== 'sold' && a.price != null ? formatPrice(a.price) : statusText(a));
export const sizeText = (a: { display: string; shape?: string; widthCm?: number; heightCm?: number; depthCm?: number }) =>
  !a.widthCm || !a.heightCm ? '' : a.display.startsWith('sculpture') ? `${a.widthCm} × ${a.depthCm ?? '?'} × ${a.heightCm} cm`
  : a.shape === 'round' ? `Ø ${a.widthCm} cm` : `${a.widthCm} × ${a.heightCm} cm`;
