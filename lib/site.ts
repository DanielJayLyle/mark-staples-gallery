export const SITE = {
  name: 'Mark Staples',
  // Set NEXT_PUBLIC_SITE_URL once Mark's domain is connected; until then Vercel's own address is used
  url: process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000'),
  description: 'Pop and street art by Mark Staples: original paintings, mirror art and sculpture. Walk the 3D gallery, see what is on show and enquire about any piece.',
};
export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
};
export const sanityEnabled = Boolean(sanityConfig.projectId);
export const formatPrice = (n?: number) => (n == null ? 'Price on request' : '£' + n.toLocaleString('en-GB'));
export const sizeText = (a: { display: string; shape?: string; widthCm: number; heightCm: number; depthCm?: number }) =>
  a.display.startsWith('sculpture') ? `${a.widthCm} × ${a.depthCm ?? '?'} × ${a.heightCm} cm`
  : a.shape === 'round' ? `Ø ${a.widthCm} cm` : `${a.widthCm} × ${a.heightCm} cm`;
