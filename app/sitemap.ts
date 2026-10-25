import type { MetadataRoute } from 'next';
import { getArtworks } from '@/lib/artworks';
import { SITE } from '@/lib/site';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const art = await getArtworks();
  return [
    { url: SITE.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/work`, changeFrequency: 'weekly', priority: .9 },
    { url: `${SITE.url}/about`, changeFrequency: 'monthly', priority: .7 },
    { url: `${SITE.url}/influences`, changeFrequency: 'monthly', priority: .6 },
    ...art.map((a) => ({ url: `${SITE.url}/work/${a.slug}`, changeFrequency: 'monthly' as const, priority: .8 })),
  ];
}
